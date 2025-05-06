import React, { useState, useEffect } from "react";
import Layout from "../components/Layout/Layout";
import { useAuth } from "../context/auth";
import axios from "axios";
import { Row, Col, Card, List, Input, Button, Avatar, Spin, Empty, Badge } from "antd";
import { SendOutlined, UserOutlined } from "@ant-design/icons";
import toast from "react-hot-toast";
import moment from "moment";
import "../styles/MessagesStyles.css";

const Messages = () => {
  const [auth] = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  
  // Fetch all conversations
  const getConversations = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/v1/messages/conversations");
      if (data?.success) {
        setConversations(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load conversations");
      setLoading(false);
    }
  };

  // Fetch messages for a specific conversation
  const getMessages = async (userId) => {
    try {
      setMessagesLoading(true);
      const { data } = await axios.get(`/api/v1/messages/conversation/${userId}`);
      if (data?.success) {
        setMessages(data.data);
      }
      setMessagesLoading(false);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load messages");
      setMessagesLoading(false);
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if (!messageText.trim() || !selectedUser) {
      return;
    }

    try {
      const { data } = await axios.post("/api/v1/messages/send", {
        receiverId: selectedUser._id,
        content: messageText
      });

      if (data?.success) {
        setMessages([...messages, data.data]);
        setMessageText("");
        // Refresh conversations to update last message
        getConversations();
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to send message");
    }
  };

  // Load conversations on component mount
  useEffect(() => {
    if (auth?.token) {
      getConversations();
    }
  }, [auth?.token]);

  // Select a user and load messages
  const selectUser = (user) => {
    setSelectedUser(user);
    getMessages(user._id);
  };

  // Mark messages as read when viewed
  const markAsRead = async (userId) => {
    try {
      await axios.post("/api/v1/messages/mark-read", { userId });
      // Update conversation in the list to show 0 unread
      setConversations(prevConversations => 
        prevConversations.map(conv => {
          if (conv.participants[0]?._id === userId) {
            return { ...conv, unreadCount: 0 };
          }
          return conv;
        })
      );
    } catch (error) {
      console.log("Error marking messages as read", error);
    }
  };

  // When selecting a user, also mark messages as read
  useEffect(() => {
    if (selectedUser?._id) {
      markAsRead(selectedUser._id);
    }
  }, [selectedUser]);

  // Format time for messages
  const formatMessageTime = (time) => {
    return moment(time).calendar();
  };

  return (
    <Layout title="Messages">
      <div className="messages-container">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={8} lg={6}>
            <Card title="Conversations" className="conversations-card">
              {loading ? (
                <div className="text-center">
                  <Spin />
                </div>
              ) : conversations.length === 0 ? (
                <Empty description="No conversations yet" />
              ) : (
                <List
                  dataSource={conversations}
                  renderItem={(item) => {
                    // Check if participants array exists and has at least one participant
                    const participant = item.participants && item.participants.length > 0 
                      ? item.participants[0] 
                      : null;
                    
                    if (!participant) {
                      return null; // Skip rendering this item if no participant
                    }
                    
                    // Get unread count safely with default of 0
                    const unreadCount = item.unreadCount || 0;
                    
                    return (
                      <List.Item
                        className={`conversation-item ${
                          selectedUser && selectedUser._id === participant._id
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => selectUser(participant)}
                      >
                        <List.Item.Meta
                          avatar={<Avatar icon={<UserOutlined />} />}
                          title={
                            <div className="conversation-title">
                              <span>{participant.name}</span>
                              {unreadCount > 0 && (
                                <Badge 
                                  count={unreadCount} 
                                  style={{ backgroundColor: '#52c41a' }}
                                  overflowCount={99} 
                                />
                              )}
                            </div>
                          }
                          description={
                            <div className="conversation-preview">
                              <p>{item.lastMessage?.substring(0, 30) || "No messages yet"}{item.lastMessage && item.lastMessage.length > 30 ? '...' : ''}</p>
                              <small>{moment(item.updatedAt).fromNow()}</small>
                            </div>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              )}
            </Card>
          </Col>

          <Col xs={24} sm={24} md={16} lg={18}>
            {selectedUser ? (
              <Card
                title={`Chat with ${selectedUser?.name || "User"}`}
                className="chat-card"
                extra={
                  <div>
                    <span>{selectedUser?.userType === 'farmer' ? 'Farmer' : 'Buyer'}</span>
                  </div>
                }
              >
                <div className="messages-list">
                  {messagesLoading ? (
                    <div className="text-center p-4">
                      <Spin />
                    </div>
                  ) : messages.length === 0 ? (
                    <Empty description="No messages yet. Start a conversation!" />
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg._id || `temp-${Date.now()}`}
                        className={`message-bubble ${
                          msg.sender === auth?.user?._id ? "sent" : "received"
                        }`}
                      >
                        <div className="message-content">{msg.content}</div>
                        <div className="message-time">
                          {formatMessageTime(msg.createdAt)}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="message-input">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    onPressEnter={sendMessage}
                  />
                  <Button 
                    type="primary" 
                    icon={<SendOutlined />} 
                    onClick={sendMessage}
                    disabled={!messageText.trim()}
                  />
                </div>
              </Card>
            ) : (
              <div className="select-conversation">
                <Empty description="Select a conversation to start chatting" />
              </div>
            )}
          </Col>
        </Row>
      </div>
    </Layout>
  );
};

export default Messages;
