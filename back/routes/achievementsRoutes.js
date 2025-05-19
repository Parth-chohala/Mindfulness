const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const achievementController = require('../Controllers/achievementscontroller');

// Configure multer storage for achievement images
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

// Image upload route for achievements
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

// Create
router.post('/achievements', achievementController.createAchievement);

// Read
router.get('/achievements', achievementController.getAchievements);
router.get('/achievements/:id', achievementController.getAchievementById);

// Update
router.put('/achievements/:id', achievementController.updateAchievement);

// Delete
router.delete('/achievements/:id', achievementController.deleteAchievement);

module.exports = router;
