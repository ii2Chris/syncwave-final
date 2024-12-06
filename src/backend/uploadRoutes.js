import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import supabaseClient from './supabaseClient.js';

const { supabase, secret } = supabaseClient;
const router = express.Router();

/**
 * Configure multer for file upload handling
 * Stores files in memory temporarily and limits file size to 5MB
 */
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

/**
 * @route POST /upload
 * @description Upload a profile picture and update user profile
 * @access Private - Requires valid JWT token
 * 
 * @bodyParam {File} file - Image file to upload (multipart/form-data)
 * 
 * @returns {Object} 200 - Successfully uploaded image with public URL
 * @returns {Object} 400 - No file uploaded or invalid file
 * @returns {Object} 401 - Invalid or missing token
 * @returns {Object} 500 - Server or storage error
 */
router.post('/upload', upload.single('file'), async (req, res) => {
    console.log('Upload request received');
  
    // Validate file presence
    if (!req.file) {
      console.log('No file received in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }
  
    try {
      // Log file details for debugging
      console.log('File details:', {
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        buffer: req.file.buffer ? 'Buffer present' : 'No buffer'
      });
  
      // Authentication verification
      const authHeader = req.headers.authorization;
      console.log('Auth header:', authHeader);
  
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Invalid authorization header format');
        return res.status(401).json({ error: 'Invalid authorization header format' });
      }
  
      const token = authHeader.split(' ')[1];
      
      // Token validation
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
      
      // Check for and handle existing profile picture
      const { data: user, error: userError } = await supabase
        .from('user_profile')
        .select('profile_picture_url')
        .eq('id', userId)
        .single();
  
      if (userError) {
        console.error('Error fetching user profile:', userError);
      }
  
      // Delete old profile picture if it exists
      if (user?.profile_picture_url) {
        const oldFilePath = user.profile_picture_url.split('/').pop();
        const { error: deleteError } = await supabase.storage
          .from('profile-pictures')
          .remove([oldFilePath]);
  
        if (deleteError) {
          console.error('Error deleting old profile picture:', deleteError);
        }
      }
  
      // Upload new profile picture
      const fileExtension = req.file.originalname.split('.').pop();
      const filePath = `${userId}.${fileExtension}`;
      
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
  
      // Get public URL for uploaded file
      const { data: { publicUrl }, error: urlError } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);
  
      if (urlError) {
        console.error('Error getting public URL:', urlError);
        return res.status(500).json({ error: 'Failed to get public URL' });
      }
  
      // Update user profile with new picture URL
      const { error: updateError } = await supabase
        .from('user_profile')
        .update({ profile_picture_url: publicUrl })
        .eq('id', userId);
  
      if (updateError) {
        console.error('Error updating profile URL:', updateError);
        return res.status(500).json({ error: 'Failed to update profile URL' });
      }
  
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
