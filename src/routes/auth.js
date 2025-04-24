const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');
const { requireAuth } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', requireAuth, authController.getCurrentUser);

module.exports = router;
