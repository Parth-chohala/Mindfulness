const express = require('express');
const router = express.Router();
const meditationSessionController = require('../Controllers/meditationsessioncontroller');

// Define routes
router.post('/meditationSessions', meditationSessionController.createMeditationSession);
router.get('/meditationSessions', meditationSessionController.getMeditationSessions);
router.get('/meditationSessions/:id', meditationSessionController.getMeditationSessionById);
router.put('/meditationSessions/:id', meditationSessionController.updateMeditationSession);

module.exports = router;
