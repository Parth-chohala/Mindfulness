const express = require('express');
const router = express.Router();
const userMeditationProgressController = require('../Controllers/usermeditationprogresscontroller');

// Create a new progress record
router.post('/userMeditationProgress', userMeditationProgressController.createUserMeditationProgress);

// Get all progress for a user
router.get('/userMeditationProgress/user/:userId', userMeditationProgressController.getUserMeditationProgress);

// Get progress by ID
router.get('/userMeditationProgress/:id', userMeditationProgressController.getUserMeditationProgress);

// Delete progress by ID
router.delete('/userMeditationProgress/:id', userMeditationProgressController.deleteUserMeditationProgress);

module.exports = router;
