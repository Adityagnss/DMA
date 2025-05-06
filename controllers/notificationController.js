import notificationModel from "../models/notificationModel.js";
import earningsModel from "../models/earningsModel.js";

// Register device token
export const registerDevice = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).send({
        success: false,
        message: "Device token is required",
      });
    }

    // Update device token in earnings model
    await earningsModel.findOneAndUpdate(
      { farmer: req.user._id },
      { deviceToken: token },
      { upsert: true }
    );

    res.json({
      success: true,
      message: "Device registered successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error registering device",
      error,
    });
  }
};

// Get user notifications
export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await notificationModel
      .find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error getting notifications",
      error,
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    await notificationModel.findByIdAndUpdate(notificationId, {
      read: true,
    });

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error marking notification as read",
      error,
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    await notificationModel.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error marking notifications as read",
      error,
    });
  }
};
