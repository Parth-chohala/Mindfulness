const express = require('express');
const router = express.Router();
const focusTimerController = require('../Controllers/focustimercontroller');

// Route to create a new focus timer
router.post('/focusTimers', focusTimerController.createFocusTimer);

// Route to get all focus timers for a user
router.get('/focusTimers', focusTimerController.getFocusTimers);

// Route to get a specific focus timer by ID
router.get('/focusTimers/:id', focusTimerController.getFocusTimerById);


router.get('/focusTimers/all/:id', focusTimerController.getallFocusTimer);

// Route to update a focus timer by ID
router.put('/focusTimers/:id', focusTimerController.updateFocusTimer);

// Route to delete a focus timer by ID
router.delete('/focusTimers/:id', focusTimerController.deleteFocusTimer);

module.exports = router;
