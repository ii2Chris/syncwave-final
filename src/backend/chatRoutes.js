import express from 'express';
import supabaseClient from './supabaseClient.js';

const { supabase } = supabaseClient;
const router = express.Router();

// Get matches with messages
router.get('/matches', async (req, res) => {
    try {
        const userId = req.user.id;
        
        const { data: matches, error } = await supabase
            .from('matches')
            .select(`
                id,
                event_id,
                userid_1,
                userid_2,
                user_profile!userid_1 (id, username, profile_picture_url),
                user_profile!userid_2 (id, username, profile_picture_url),
                chat_messages (
                    id,
                    content,
                    created_at,
                    is_read,
                    sender_id
                )
            `)
            .or(`userid_1.eq.${userId},userid_2.eq.${userId}`);

        if (error) throw error;

        const formattedMatches = matches.map(match => {
            const otherUser = match.userid_1 === userId 
                ? match.user_profile_2 
                : match.user_profile_1;

            // Get unread messages count
            const unreadCount = match.chat_messages?.filter(msg => 
                msg.sender_id !== userId && !msg.is_read
            ).length || 0;

            return {
                matchId: match.id,
                eventId: match.event_id,
                otherUser: {
                    id: otherUser.id,
                    username: otherUser.username,
                    profilePicture: otherUser.profile_picture_url
                },
                unreadMessages: unreadCount,
                lastMessage: match.chat_messages?.[match.chat_messages.length - 1]
            };
        });

        res.json({ matches: formattedMatches });
    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// Get messages for a specific match
router.get('/:matchId/messages', async (req, res) => {
    try {
        const { matchId } = req.params;
        const userId = req.user.id;

        // Verify user is part of this match
        const { data: match } = await supabase
            .from('matches')
            .select('*')
            .eq('id', matchId)
            .or(`userid_1.eq.${userId},userid_2.eq.${userId}`)
            .single();

        if (!match) {
            return res.status(403).json({ error: 'Not authorized to view this chat' });
        }

        // Mark messages as read
        const { error: updateError } = await supabase
            .from('chat_messages')
            .update({ is_read: true })
            .eq('match_id', matchId)
            .eq('receiver_id', userId)
            .eq('is_read', false);

        if (updateError) {
            console.error('Error marking messages as read:', updateError);
        }

        // Get messages
        const { data: messages, error } = await supabase
            .from('chat_messages')
            .select(`
                id,
                content,
                created_at,
                is_read,
                sender_id,
                receiver_id,
                user_profile!sender_id (username, profile_picture_url)
            `)
            .eq('match_id', matchId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        res.json({ messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Send a message
router.post('/:matchId/messages', async (req, res) => {
    try {
        const { matchId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        if (!content?.trim()) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        // Verify user is part of this match and get receiver_id
        const { data: match } = await supabase
            .from('matches')
            .select('*')
            .eq('id', matchId)
            .or(`userid_1.eq.${userId},userid_2.eq.${userId}`)
            .single();

        if (!match) {
            return res.status(403).json({ error: 'Not authorized to send messages in this chat' });
        }

        // Determine receiver_id
        const receiver_id = match.userid_1 === userId ? match.userid_2 : match.userid_1;

        const { data: message, error } = await supabase
            .from('chat_messages')
            .insert({
                match_id: matchId,
                sender_id: userId,
                receiver_id,
                content,
                created_at: new Date().toISOString(),
                is_read: false
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

export default router; 