import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import supabaseClient from './supabaseClient.js';

const { supabase, secret } = supabaseClient;
const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024 // Example: 5MB limit
    }
  });
  // Endpoint to upload image to Supabase .ex user profile
  router.post('/upload', upload.single('file'), async (req, res) => {
    console.log('Upload request received');
  
    if (!req.file) {
      console.log('No file received in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }
  
    try {
      console.log('File details:', {
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        buffer: req.file.buffer ? 'Buffer present' : 'No buffer'
      });
  
      
      // Get and verify token
      const authHeader = req.headers.authorization;
      console.log('Auth header:', authHeader);
  
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Invalid authorization header format');
        return res.status(401).json({ error: 'Invalid authorization header format' });
      }
  
      const token = authHeader.split(' ')[1];
      console.log('Token extracted:', token ? token.substring(0, 20) + '...' : 'null');
  
      if (!token) {
        console.log('No token found after Bearer');
        return res.status(401).json({ error: 'No token provided' });
      }
  
      // Decode token
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, secret);
        console.log('Token decoded successfully:', {
          userId: decodedToken.userId,
          email: decodedToken.email
        });
      } catch (err) {
        console.error('Token verification failed:', {
          error: err.message,
          token: token.substring(0, 20) + '...',
          secret: secret ? 'Present' : 'Missing'
        });
        return res.status(401).json({ 
          error: 'Invalid token. Please log in again.',
          details: err.message
        });
      }
  
      const userId = decodedToken.userId;
      console.log('User ID from token:', userId);
  
      // Check for existing profile picture
      console.log('Checking for existing profile picture...');
      const { data: user, error: userError } = await supabase
        .from('user_profile')
        .select('profile_picture_url')
        .eq('id', userId)
        .single();
  
      if (userError) {
        console.error('Error fetching user profile:', userError);
      } else {
        console.log('Current profile picture URL:', user?.profile_picture_url);
      }
  
      // Delete old picture if exists
      if (user?.profile_picture_url) {
        const oldFilePath = user.profile_picture_url.split('/').pop();
        console.log('Attempting to delete old profile picture:', oldFilePath);
        
        const { error: deleteError } = await supabase.storage
          .from('profile-pictures')
          .remove([oldFilePath]);
  
        if (deleteError) {
          console.error('Error deleting old profile picture:', deleteError);
        } else {
          console.log('Old profile picture deleted successfully');
        }
      }
  
      // Upload new picture
      const fileExtension = req.file.originalname.split('.').pop();
      const filePath = `${userId}.${fileExtension}`;
      console.log('New file path:', filePath);
  
      console.log('Attempting to upload new profile picture...');
      const { data, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });
  
      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        return res.status(500).json({ 
          error: uploadError.message,
          details: uploadError 
        });
      }
  
      console.log('Upload successful:', data);
  
      // Get public URL
      const { data: { publicUrl }, error: urlError } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);
  
      if (urlError) {
        console.error('Error getting public URL:', urlError);
        return res.status(500).json({ error: 'Failed to get public URL' });
      }
  
      console.log('Generated public URL:', publicUrl);
  
      // Update user profile with new URL
      console.log('Updating user profile with new URL...');
      const { error: updateError } = await supabase
        .from('user_profile')
        .update({ profile_picture_url: publicUrl })
        .eq('id', userId);
  
      if (updateError) {
        console.error('Error updating profile URL:', updateError);
        return res.status(500).json({ error: 'Failed to update profile URL' });
      }
  
      console.log('Profile picture update complete');
      res.json({ url: publicUrl });
  
    } catch (err) {
      console.error('Detailed error:', {
        message: err.message,
        stack: err.stack,
        details: err
      });
      res.status(500).json({ 
        error: 'Internal server error',
        details: err.message 
      });
    }
  });

  export default router;
