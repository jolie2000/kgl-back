// This controller lets managers read stock alerts.
const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    if (req.user.role !== 'Manager') {
      return res.status(403).json({ message: 'Only managers can view notifications' });
    }

    const query = req.user.branch === 'All' ? {} : { branch: req.user.branch };
    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(100);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    if (req.user.role !== 'Manager') {
      return res.status(403).json({ message: 'Only managers can update notifications' });
    }

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (req.user.branch !== 'All' && notification.branch !== req.user.branch) {
      return res.status(403).json({ message: 'Not allowed to update this notification' });
    }

    notification.read = true;
    await notification.save();
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
