const express = require('express');
const router = express.Router();
const achievementController = require('../Controllers/achievementscontroller');

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
