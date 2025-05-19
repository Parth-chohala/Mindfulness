const express = require('express');
const router = express.Router();
const breaksController = require('../Controllers/breakcontroller');

// GET break settings by user ID
router.get('/breaks/:id', breaksController.getBreakByUserId);

// PUT (update) break settings by user ID
router.put('/breaks/:id', breaksController.updateBreak);

// POST (create) new break settings
router.post('/breaks', breaksController.createBreak);

module.exports = router;
