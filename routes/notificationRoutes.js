// These routes let managers view and mark stock alerts.
const express = require('express');
const router = express.Router();
const { getNotifications, markNotificationRead } = require('../controllers/notificationController');
const { protect, managerOnly } = require('../middleware/authMiddleware');

router.get('/', protect, managerOnly, getNotifications);
router.patch('/:id/read', protect, managerOnly, markNotificationRead);

module.exports = router;
