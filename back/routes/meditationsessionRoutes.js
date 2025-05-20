const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const meditationSessionController = require('../Controllers/meditationsessioncontroller');

// Configure multer storage for meditation files
const meditationStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../collection');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// Configure upload middleware for meditation files
const meditationUpload = multer({ 
  storage: meditationStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: function(req, file, cb) {
    // Accept video and audio files
    const filetypes = /mp4|mkv|avi|mp3|wav|ogg/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only video and audio files are allowed'));
  }
});

// Configure multer storage for image uploads
const imageStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../collection');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// Configure upload middleware for images
const imageUpload = multer({ 
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    // Accept image files only
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Image upload route
router.post('/upload', imageUpload.single('image'), (req, res) => {
  try {
    // If no file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Return the file path
    res.status(200).json({ 
      imageUrl: req.file.filename,
      message: 'File uploaded successfully' 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Define meditation session routes with file upload middleware
router.post('/meditationSessions', meditationUpload.single('mediaFile'), meditationSessionController.createMeditationSession);
router.put('/meditationSessions/:id', meditationUpload.single('mediaFile'), meditationSessionController.updateMeditationSession);
router.get('/meditationSessions', meditationSessionController.getMeditationSessions);
router.get('/meditationSessions/:id', meditationSessionController.getMeditationSessionById);
router.delete('/meditationSessions/:id', meditationSessionController.deleteMeditationSession);

module.exports = router;
