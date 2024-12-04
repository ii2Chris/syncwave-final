import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import supabaseClient from './supabaseClient';

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
    if (!req.file) {
      console.log('No file received');
      return res.status(400).json({ error: 'No file uploaded' });
    }
  
    const fileName = `${Date.now()}_${req.file.originalname}`;
    const filePath = `profile-pictures/${fileName}`;
  
    try {
      console.log('Attempting upload with:', {
        fileName,
        filePath,
        mimeType: req.file.mimetype,
        fileSize: req.file.size
      });
  
      const { data, error } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });
  
      if (error) {
        console.error('Supabase upload error:', error);
        return res.status(500).json({ error: error.message });
      }
  
      console.log('Upload successful:', data);
  
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);
  
      console.log('Generated public URL:', publicUrl);
  
      res.json({ url: publicUrl });
  
    } catch (err) {
      console.error('Detailed error:', {
        message: err.message,
        stack: err.stack,
        details: err
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  export default router;
