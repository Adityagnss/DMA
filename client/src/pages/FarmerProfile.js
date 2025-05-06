import React, { useState, useEffect } from "react";
import Layout from "../components/Layout/Layout";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { BiPhone } from "react-icons/bi";
import { BsChatDots, BsStarFill, BsStarHalf, BsStar } from "react-icons/bs";
import { useAuth } from "../context/auth";
import toast from "react-hot-toast";
import "../styles/FarmerProfile.css";

const FarmerProfile = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [auth] = useAuth();
  const [farmer, setFarmer] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  // Fetch farmer data
  const getFarmerDetails = async () => {
    try {
      const { data } = await axios.get(`/api/v1/auth/farmer/${params.id}`);
      if (data?.success) {
        setFarmer(data.farmer);
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  // Fetch farmer's products
  const getFarmerProducts = async () => {
    try {
      const { data } = await axios.get(`/api/v1/produce/farmer-products/${params.id}`);
      if (data?.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch farmer's reviews
  const getFarmerReviews = async () => {
    try {
      const { data } = await axios.get(`/api/v1/review/farmer/${params.id}`);
      if (data?.success) {
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch farmer's completed orders (sales history)
  const getFarmerSalesHistory = async () => {
    try {
      const { data } = await axios.get(`/api/v1/orders/farmer-sales/${params.id}`);
      if (data?.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch messages between current user and farmer
  const getMessages = async () => {
    if (!auth?.token || !params.id) return;
    
    try {
      const { data } = await axios.get(`/api/v1/messages/conversation/${params.id}`);
      if (data?.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    if (params?.id) {
      getFarmerDetails();
      getFarmerProducts();
      getFarmerReviews();
      getFarmerSalesHistory();
    }
  }, [params.id]);

  useEffect(() => {
    if (chatOpen && auth?.token) {
      getMessages();
    }
  }, [chatOpen, auth?.token, params.id]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim() || !auth?.token) return;
    
    if (!auth?.user) {
      toast.error("Please login to send messages");
      navigate('/login');
      return;
    }
    
    try {
      const { data } = await axios.post('/api/v1/messages/send', {
        receiverId: params.id,
        content: message
      });
      
      if (data?.success) {
        setMessages([...messages, data.data]);
        setMessage("");
        toast.success("Message sent successfully");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  // Start a chat with the farmer
  const startChat = () => {
    if (!auth?.user) {
      toast.error("Please login to chat with the farmer");
      navigate('/login');
      return;
    }
    
    setChatOpen(true);
  };

  // Navigate to Messages page
  const goToMessages = () => {
    navigate('/messages');
  };

  // Calculate average rating
  const calculateAverageRating = () => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  // Render star rating
  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<BsStarFill key={i} className="star-filled" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<BsStarHalf key={i} className="star-half" />);
      } else {
        stars.push(<BsStar key={i} className="star-empty" />);
      }
    }
    
    return stars;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Layout title="Farmer Profile">
      <div className="container farmer-profile-container">
        {loading ? (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="row">
              <div className="col-md-4">
                <div className="farmer-info-card">
                  <div className="farmer-avatar">
                    {farmer?.name?.charAt(0).toUpperCase()}
                  </div>
                  <h2>{farmer?.name}</h2>
                  <p className="farmer-location">{farmer?.address?.city}, {farmer?.address?.state}</p>
                  <div className="farmer-rating">
                    {renderStarRating(calculateAverageRating())}
                    <span className="rating-number">({calculateAverageRating()})</span>
                    <span className="review-count">({reviews.length} reviews)</span>
                  </div>
                  <div className="farmer-contact-buttons">
                    <a href={`tel:${farmer?.phone}`} className="btn btn-primary">
                      <BiPhone /> Call
                    </a>
                    <button 
                      className="btn btn-secondary"
                      onClick={startChat}
                    >
                      <BsChatDots /> Chat
                    </button>
                  </div>
                  <div className="farmer-details">
                    <p><strong>Email:</strong> {farmer?.email}</p>
                    <p><strong>Phone:</strong> {farmer?.phone}</p>
                    <p><strong>Member Since:</strong> {formatDate(farmer?.createdAt)}</p>
                  </div>
                </div>
              </div>
              
              <div className="col-md-8">
                {chatOpen && (
                  <div className="chat-box">
                    <div className="chat-header">
                      <h3>Chat with {farmer?.name}</h3>
                      <div>
                        <button className="view-all-btn" onClick={goToMessages}>View All Messages</button>
                        <button className="close-btn" onClick={() => setChatOpen(false)}>×</button>
                      </div>
                    </div>
                    <div className="chat-messages">
                      {messages.length === 0 ? (
                        <p className="no-messages">No messages yet. Start a conversation!</p>
                      ) : (
                        messages.map(msg => (
                          <div key={msg._id} className={`message ${msg.sender === auth?.user?._id ? 'buyer' : 'farmer'}`}>
                            <div className="message-content">{msg.content}</div>
                            <div className="message-time">
                              {formatDate(msg.createdAt)} {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="chat-input">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <button onClick={handleSendMessage}>Send</button>
                    </div>
                  </div>
                )}

                <div className="farmer-tabs">
                  <ul className="nav nav-tabs" id="farmerTab" role="tablist">
                    <li className="nav-item" role="presentation">
                      <button className="nav-link active" id="products-tab" data-bs-toggle="tab" data-bs-target="#products" type="button" role="tab" aria-controls="products" aria-selected="true">
                        Products
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button className="nav-link" id="reviews-tab" data-bs-toggle="tab" data-bs-target="#reviews" type="button" role="tab" aria-controls="reviews" aria-selected="false">
                        Reviews
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button className="nav-link" id="sales-tab" data-bs-toggle="tab" data-bs-target="#sales" type="button" role="tab" aria-controls="sales" aria-selected="false">
                        Sales History
                      </button>
                    </li>
                  </ul>
                  <div className="tab-content" id="farmerTabContent">
                    <div className="tab-pane fade show active" id="products" role="tabpanel" aria-labelledby="products-tab">
                      {products.length === 0 ? (
                        <p className="text-center my-4">No products available.</p>
                      ) : (
                        <div className="row">
                          {products.map(product => (
                            <div key={product._id} className="col-md-6 mb-4">
                              <div className="card product-card">
                                <img 
                                  src={`/api/v1/produce/produce-photo/${product._id}`} 
                                  className="card-img-top" 
                                  alt={product.name} 
                                />
                                <div className="card-body">
                                  <h5 className="card-title">{product.name}</h5>
                                  <p className="card-text">{product.description.substring(0, 100)}...</p>
                                  <div className="product-price">
                                    ₹{product.price} per {product.unit}
                                  </div>
                                  <div className="product-stock">
                                    {product.quantity > 0 ? (
                                      <span className="stock-available">In Stock: {product.quantity} {product.unit}</span>
                                    ) : (
                                      <span className="stock-out">Sold Out</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="tab-pane fade" id="reviews" role="tabpanel" aria-labelledby="reviews-tab">
                      {reviews.length === 0 ? (
                        <p className="text-center my-4">No reviews yet.</p>
                      ) : (
                        <div className="reviews-list">
                          {reviews.map(review => (
                            <div key={review._id} className="review-card">
                              <div className="review-header">
                                <div className="reviewer-info">
                                  <div className="reviewer-avatar">
                                    {review.reviewer.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="reviewer-name">
                                    {review.reviewer.name}
                                  </div>
                                </div>
                                <div className="review-date">
                                  {formatDate(review.createdAt)}
                                </div>
                              </div>
                              <div className="review-rating">
                                {renderStarRating(review.rating)}
                              </div>
                              <div className="review-comment">
                                {review.comment}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="tab-pane fade" id="sales" role="tabpanel" aria-labelledby="sales-tab">
                      {orders.length === 0 ? (
                        <p className="text-center my-4">No sales history available.</p>
                      ) : (
                        <div className="sales-history">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orders.map(order => (
                                <tr key={order._id}>
                                  <td>#{order._id.substring(order._id.length - 8)}</td>
                                  <td>{formatDate(order.createdAt)}</td>
                                  <td>{order.products.map(p => p.name).join(', ')}</td>
                                  <td>{order.products.map(p => `${p.quantity} ${p.unit}`).join(', ')}</td>
                                  <td>₹{order.products.reduce((total, p) => total + (p.price * p.quantity), 0).toFixed(2)}</td>
                                  <td>
                                    <span className={`status-badge status-${order.status.toLowerCase()}`}>
                                      {order.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default FarmerProfile;
