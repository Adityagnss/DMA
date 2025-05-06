import messageModel from '../models/messageModel.js';
import conversationModel from '../models/conversationModel.js';
import userModel from '../models/userModel.js';

// Create a new message
export const createMessageController = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !content) {
      return res.status(400).send({
        success: false,
        message: "Receiver ID and content are required"
      });
    }

    // Check if receiver exists
    const receiver = await userModel.findById(receiverId);
    if (!receiver) {
      return res.status(404).send({
        success: false,
        message: "Receiver not found"
      });
    }

    // Find or create conversation
    let conversation = await conversationModel.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (!conversation) {
      // Initialize unreadCounts Map with 1 unread message for receiver
      const unreadCounts = new Map();
      unreadCounts.set(receiverId.toString(), 1);
      
      conversation = await new conversationModel({
        participants: [senderId, receiverId],
        lastMessage: content,
        unreadCounts
      }).save();
    } else {
      // Update last message and increment unread count for receiver
      conversation.lastMessage = content;
      
      // Get current unread count for receiver or default to 0
      const currentUnreadCount = conversation.unreadCounts.get(receiverId.toString()) || 0;
      conversation.unreadCounts.set(receiverId.toString(), currentUnreadCount + 1);
      
      await conversation.save();
    }

    // Create the message
    const message = new messageModel({
      sender: senderId,
      receiver: receiverId,
      content,
      conversation: conversation._id
    });

    await message.save();

    res.status(201).send({
      success: true,
      message: "Message sent successfully",
      data: message
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in sending message",
      error
    });
  }
};

// Get messages between two users
export const getMessagesController = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "User ID is required"
      });
    }

    // Find conversation
    const conversation = await conversationModel.findOne({
      participants: { $all: [currentUserId, userId] }
    });

    if (!conversation) {
      return res.status(200).send({
        success: true,
        message: "No messages found",
        data: []
      });
    }

    // Get messages
    const messages = await messageModel.find({
      conversation: conversation._id
    }).sort({ createdAt: 1 });

    // Mark messages as read
    await messageModel.updateMany(
      { 
        conversation: conversation._id,
        receiver: currentUserId,
        read: false
      },
      { read: true }
    );

    // Reset unread count
    if (conversation.unreadCounts.get(currentUserId.toString()) > 0) {
      conversation.unreadCounts.set(currentUserId.toString(), 0);
      await conversation.save();
    }

    res.status(200).send({
      success: true,
      data: messages
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting messages",
      error
    });
  }
};

// Get all conversations for a user
export const getConversationsController = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all conversations where the current user is a participant
    const conversations = await conversationModel.find({
      participants: userId
    })
    .populate({
      path: 'participants',
      match: { _id: { $ne: userId } },
      select: 'name email phone userType'
    })
    .sort({ updatedAt: -1 });

    // Format the result to include proper unread counts for the current user
    const result = conversations.map(conversation => {
      // Convert to plain object so we can modify it
      const convObj = conversation.toObject();
      
      // Get unread count for current user or default to 0
      const unreadCount = conversation.unreadCounts && 
                           conversation.unreadCounts.get(userId.toString()) || 0;
      
      // Replace the Map with a simple number for the client
      convObj.unreadCount = unreadCount;
      delete convObj.unreadCounts;
      
      return convObj;
    });

    res.status(200).send({
      success: true,
      data: result
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting conversations",
      error
    });
  }
};

// Get total unread message count for a user
export const getUnreadCountController = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all conversations where the current user is a participant
    const conversations = await conversationModel.find({
      participants: userId
    });

    // Calculate total unread count across all conversations
    let totalUnreadCount = 0;
    
    conversations.forEach(conversation => {
      // Get unread count for current user or default to 0
      const unreadCount = conversation.unreadCounts && 
                          conversation.unreadCounts.get(userId.toString()) || 0;
      totalUnreadCount += unreadCount;
    });

    res.status(200).send({
      success: true,
      count: totalUnreadCount
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error getting unread message count",
      error
    });
  }
};

// Mark messages as read in a conversation
export const markMessagesAsReadController = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { userId } = req.body; // The other user in the conversation

    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "User ID is required"
      });
    }

    // Find the conversation
    const conversation = await conversationModel.findOne({
      participants: { $all: [currentUserId, userId] }
    });

    if (!conversation) {
      return res.status(404).send({
        success: false,
        message: "Conversation not found"
      });
    }

    // Reset unread count for current user
    if (conversation.unreadCounts && conversation.unreadCounts.get(currentUserId.toString()) > 0) {
      conversation.unreadCounts.set(currentUserId.toString(), 0);
      await conversation.save();
    }

    res.status(200).send({
      success: true,
      message: "Messages marked as read"
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error marking messages as read",
      error
    });
  }
};
