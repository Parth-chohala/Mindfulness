const express = require('express');
const router = express.Router();
const userController = require('../Controllers/usercontroller');

// Get all users
router.get('/user', userController.getAllUsers);

// Get user by ID
router.get('/user/:id', userController.getUserById);

router.post("/user", userController.createUser);
router.post("/user/login", userController.loginUser);
router.put("/user/:id", userController.updateUser);
router.delete("/user/:id", userController.deleteUser);

module.exports = router;
