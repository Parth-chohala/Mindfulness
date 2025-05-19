const express = require('express');
const router = express.Router();
const taskController = require('../Controllers/taskcontroller');

// Create task
router.post('/', taskController.createTask);

// Get all tasks for a user
router.get('/:userId', taskController.getTasksByUser);
router.get('/', taskController.getalltasks);

// Get task by ID
router.get('/task/:id', taskController.getTaskById);

// Update task
router.put('/:id', taskController.updateTask);

// Delete task
router.delete('/:id', taskController.deleteTask);

module.exports = router;
