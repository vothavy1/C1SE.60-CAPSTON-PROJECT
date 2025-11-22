const { AdminNotification, User, Role } = require('../models');
const { Op } = require('sequelize');

// Tạo thông báo mới
async function createNotification(type, title, message, relatedUserId = null, relatedData = null, priority = 'MEDIUM') {
  try {
    const notification = await AdminNotification.create({
      type,
      title,
      message,
      related_user_id: relatedUserId,
      related_data: relatedData,
      priority
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

// Lấy tất cả thông báo
async function getAllNotifications(req, res) {
  try {
    const { is_read, type, priority, limit = 50 } = req.query;
    
    const where = {};
    if (is_read !== undefined) {
      where.is_read = is_read === 'true';
    }
    if (type) {
      where.type = type;
    }
    if (priority) {
      where.priority = priority;
    }

    const notifications = await AdminNotification.findAll({
      where,
      include: [
        {
          model: User,
          as: 'RelatedUser',
          attributes: ['user_id', 'username', 'email'],
          include: [{ model: Role, attributes: ['role_name'] }]
        }
      ],
      order: [
        ['is_read', 'ASC'],
        ['priority', 'DESC'],
        ['created_at', 'DESC']
      ],
      limit: parseInt(limit)
    });

    // Đếm số thông báo chưa đọc
    const unreadCount = await AdminNotification.count({
      where: { is_read: false }
    });

    return res.status(200).json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải thông báo'
    });
  }
}

// Đánh dấu đã đọc
async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    
    const notification = await AdminNotification.findByPk(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }

    notification.is_read = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Đã đánh dấu đã đọc'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật thông báo'
    });
  }
}

// Đánh dấu tất cả đã đọc
async function markAllAsRead(req, res) {
  try {
    await AdminNotification.update(
      { is_read: true },
      { where: { is_read: false } }
    );

    return res.status(200).json({
      success: true,
      message: 'Đã đánh dấu tất cả thông báo là đã đọc'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật thông báo'
    });
  }
}

// Xóa thông báo
async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    
    const notification = await AdminNotification.findByPk(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }

    await notification.destroy();

    return res.status(200).json({
      success: true,
      message: 'Đã xóa thông báo'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể xóa thông báo'
    });
  }
}

// Xóa tất cả thông báo đã đọc
async function deleteReadNotifications(req, res) {
  try {
    await AdminNotification.destroy({
      where: { is_read: true }
    });

    return res.status(200).json({
      success: true,
      message: 'Đã xóa tất cả thông báo đã đọc'
    });
  } catch (error) {
    console.error('Delete read notifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể xóa thông báo'
    });
  }
}

// Lấy số lượng thông báo chưa đọc
async function getUnreadCount(req, res) {
  try {
    const count = await AdminNotification.count({
      where: { is_read: false }
    });

    return res.status(200).json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể đếm thông báo'
    });
  }
}

module.exports = {
  createNotification,
  getAllNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  getUnreadCount
};
