const Notification = require("../models/Notification");

exports.getNotifications = async (req, res, next) => {
  try {
    const { unread } = req.query;
    const query = { userId: req.user.id };
    if (unread === "true") {
      query.readStatus = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { readStatus: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (err) {
    next(err);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, readStatus: false },
      { readStatus: true }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
};

