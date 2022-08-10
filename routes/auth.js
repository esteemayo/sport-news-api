const express = require('express');

const authController = require('../controllers/authController');

const router = express.Router();

router.post('/login', authController.login);

router.post('/forgot-password', authController.forgotPassword);

router.post('/reset-password/:token', authController.resetPassword);

router.post('/update-my-password', authController.updatePassword);

module.exports = router;
