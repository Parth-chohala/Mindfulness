const express = require('express');
const router = express.Router();
const goalController = require('../Controllers/goalcontroller');

router.post('/goal', goalController.createGoal);
router.get('/goal', goalController.getAllGoals);
router.get('/goal/:id', goalController.getGoalById);
router.put('/goal/:id', goalController.updateGoal);
router.delete('/goal/:id', goalController.deleteGoal);
// router.get('/goal/user/:userId', goalController.getGoalsByUserId);
// router.put('/goal/:id/progress', goalController.updateGoalProgress);

module.exports = router;
