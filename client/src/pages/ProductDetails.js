import React, { useState, useEffect, useCallback, useRef } from "react";
import Layout from "./../components/Layout/Layout";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/ProductDetailsStyles.css";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import { useSocket } from "../context/socket";
import toast from "react-hot-toast";
import { BiPhoneCall, BiMessageDetail } from "react-icons/bi";
import { MdContactPage, MdOutlineRateReview } from "react-icons/md";
import { FaTimes } from "react-icons/fa";
import { Avatar, Rate, Spin, Modal, Form, Input, Button, Tabs, Empty } from "antd";
import { UserOutlined } from "@ant-design/icons";
import moment from "moment";

const { TabPane } = Tabs;
const { TextArea } = Input;

const ProductDetails = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState({});
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [cart, setCart, addToCart, removeFromCart] = useCart();
  const [auth] = useAuth();
  const socket = useSocket();
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [availableStock, setAvailableStock] = useState(0);
  const [userReservation, setUserReservation] = useState(0);
  const [totalStock, setTotalStock] = useState(0);
  const [stockLoading, setStockLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [farmerDetails, setFarmerDetails] = useState(null);
  const [farmerReviews, setFarmerReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  //initial details
  const getProduct = useCallback(async () => {
    try {
      const slug = params.slug;
      if (!slug) {
        console.log("Product ID or slug is missing");
        return;
      }

      setLoading(true);
      const { data } = await axios.get(`/api/v1/produce/get-produce/${slug}`);
      setLoading(false);
      
      if (data?.success) {
        setProduct(data?.produce);
        setAvailableStock(data?.produce.quantity);
        setTotalStock(data?.produce.quantity);
        // Also fetch farmer details
        if (data?.produce?.farmer?._id) {
          getFarmerDetails(data.produce.farmer._id);
          getFarmerReviews(data.produce.farmer._id);
        }
        getSimilarProduct(data?.produce._id, data?.produce.category);
      } else {
        toast.error("Failed to load product details");
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
      toast.error("Something went wrong when fetching product");
    }
  }, [params?.slug, navigate]);

  useEffect(() => {
    if (params?.slug) getProduct();
  }, [params?.slug, getProduct]);
  
  //get similar product
  const getSimilarProduct = async (pid, cid) => {
    try {
      const { data } = await axios.get(
        `/api/v1/produce/related-produce/${pid}/${cid}`
      );
      setRelatedProducts(data?.produces);
    } catch (error) {
      console.log(error);
    }
  };

  // Calculate remaining stock after accounting for cart items
  const calculateRemainingStock = useCallback(() => {
    if (!product?._id) return 0;
    
    // Find if this product is already in cart
    const existingProduct = cart.find(item => item._id === product._id);
    const cartQuantity = existingProduct ? existingProduct.cartQuantity : 0;
    
    // Calculate remaining available stock
    return product.quantity - cartQuantity;
  }, [product, cart]);

  useEffect(() => {
    setAvailableStock(calculateRemainingStock());
  }, [calculateRemainingStock, product]);

  // Custom add to cart function
  const handleAddToCart = async () => {
    try {
      // Validate quantity
      if (purchaseQuantity <= 0) {
        toast.error("Please select a valid quantity");
        return;
      }
      
      // Check if quantity exceeds available stock + user's existing reservation
      const effectiveStock = availableStock + userReservation;
      if (purchaseQuantity > effectiveStock) {
        toast.error(`Only ${effectiveStock} units available`);
        return;
      }
      
      // Use the new addToCart function from context
      const success = await addToCart(product, purchaseQuantity);
      
      if (success) {
        toast.success("Added to cart");
        // Refresh available stock
        getAvailableStock();
      }
    } catch (error) {
      console.log("Error adding to cart:", error);
      toast.error("Failed to add to cart");
    }
  };

  // Handle quantity change
  const handleQuantityChange = (value) => {
    const newValue = parseInt(value);
    // Check if it's a valid number
    if (isNaN(newValue) || newValue < 1) {
      setPurchaseQuantity(1);
      return;
    }
    
    // Check if quantity exceeds available stock + user's own reservation
    const maxAvailable = availableStock + userReservation;
    if (newValue > maxAvailable) {
      setPurchaseQuantity(maxAvailable);
      toast.error(`Only ${maxAvailable} units available`);
      return;
    }
    
    setPurchaseQuantity(newValue);
  };
  
  // Get farmer details
  const getFarmerDetails = async (farmerId) => {
    try {
      const { data } = await axios.get(`/api/v1/auth/farmer/${farmerId}`);
      if (data?.success) {
        setFarmerDetails(data.farmer);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Get farmer reviews
  const getFarmerReviews = async (farmerId) => {
    try {
      setReviewsLoading(true);
      const { data } = await axios.get(`/api/v1/review/farmer/${farmerId}`);
      if (data?.success) {
        setFarmerReviews(data.reviews);
      }
      setReviewsLoading(false);
    } catch (error) {
      console.log(error);
      setReviewsLoading(false);
    }
  };
  
  // Navigate to farmer profile
  const navigateToFarmerProfile = () => {
    if (product?.farmer?._id) {
      navigate(`/farmer/${product.farmer._id}`);
    } else {
      toast.error("Farmer information not available");
    }
  };

  // Check if product is in stock
  const isInStock = () => {
    return availableStock > 0;
  };

  // Open chat modal
  const openChatModal = async () => {
    if (!auth?.token) {
      toast.error("Please login to chat with the farmer");
      return;
    }

    if (!product?.farmer?._id) {
      toast.error("Farmer information not available");
      return;
    }

    setChatModalVisible(true);
    setChatLoading(true);
    
    try {
      // Fetch previous messages
      const { data } = await axios.get(`/api/v1/messages/conversation/${product.farmer._id}`);
      if (data?.success) {
        setChatMessages(data.data);
      }
      setChatLoading(false);
    } catch (error) {
      console.log(error);
      setChatLoading(false);
    }
  };

  // Send message using WebSocket
  const sendMessage = async () => {
    if (!messageText.trim() || !product?.farmer?._id) {
      return;
    }

    const messageData = {
      receiverId: product.farmer._id,
      senderId: auth.user._id,
      senderName: auth.user.name,
      content: messageText,
      timestamp: new Date().toISOString()
    };

    try {
      // Store in database
      const { data } = await axios.post("/api/v1/messages/send", {
        receiverId: product.farmer._id,
        content: messageText
      });

      if (data?.success) {
        // Send via socket
        if (socket) {
          socket.emit("private_message", messageData);
        }
        
        // Update local state
        setChatMessages([...chatMessages, data.data]);
        setMessageText("");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to send message");
    }
  };

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // Listen for socket messages
  useEffect(() => {
    if (socket && auth?.user?._id) {
      socket.on("receive_message", (data) => {
        // Only add if from the farmer we're chatting with
        if (data.senderId === product?.farmer?._id) {
          setChatMessages((prev) => [...prev, {
            content: data.content,
            sender: data.senderId,
            receiver: data.receiverId,
            createdAt: data.timestamp
          }]);
        }
      });
      
      return () => {
        socket.off("receive_message");
      };
    }
  }, [socket, auth?.user?._id, product?.farmer?._id]);

  // Format time for messages
  const formatMessageTime = (time) => {
    return moment(time).calendar();
  };

  // Calculate average rating
  const calculateAverageRating = () => {
    if (!farmerReviews.length) return 0;
    const sum = farmerReviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / farmerReviews.length;
  };

  // Get available stock considering reservations
  const getAvailableStock = async () => {
    try {
      if (!product?._id) return;
      
      setStockLoading(true);
      const { data } = await axios.get(`/api/v1/reservations/available-stock/${product._id}`);
      setStockLoading(false);
      
      if (data?.success) {
        setAvailableStock(data.availableStock);
        setUserReservation(data.userReservation);
        setTotalStock(data.totalStock);
        
        // If user's quantity selection exceeds available stock + their reservation, adjust it
        if (purchaseQuantity > (data.availableStock + data.userReservation)) {
          setPurchaseQuantity(Math.max(1, data.availableStock + data.userReservation));
        }
      }
    } catch (error) {
      console.log("Error fetching available stock:", error);
      setStockLoading(false);
    }
  };

  // Get available stock when product or auth changes
  useEffect(() => {
    if (product?._id) {
      getAvailableStock();
    }
  }, [product?._id, auth?.token]);

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <Spin size="large" />
          <p>Loading product details...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="row container product-details">
        <div className="col-md-6 product-details-img">
          <img
            src={`/api/v1/produce/produce-photo/${product?._id || product?.slug}`}
            className="card-img-top"
            alt={product?.name}
            height="300"
            width="350px"
            onError={(e) => {
              e.target.src = `/images/default-product.png`;
              e.target.onerror = null; // Prevent infinite loop
            }}
          />
        </div>
        <div className="col-md-6 product-details-info">
          <h1 className="text-center">Product Details</h1>
          <hr />
          <h6>Name : {product.name}</h6>
          <h6>Description : {product.description}</h6>
          <h6>
            Price : ₹{product.price} per {product.unit}
          </h6>
          
          <div className="mb-3">
            <h6 className="text-muted mb-2">Stock Information:</h6>
            <p>
              {stockLoading ? (
                <span>Loading stock information...</span>
              ) : (
                <>
                  <strong>Available:</strong>{" "}
                  {availableStock + userReservation} {product?.unit} 
                  {userReservation > 0 && (
                    <span className="text-info">
                      {" "}(including {userReservation} {product?.unit} in your cart)
                    </span>
                  )}
                  <br />
                  <small className="text-muted">
                    Total stock: {totalStock} {product?.unit}
                  </small>
                </>
              )}
            </p>
          </div>
          
          <div className="quantity-selector">
            <label htmlFor="quantity">Quantity:</label>
            <input
              type="number"
              id="quantity"
              min="1"
              max={availableStock}
              value={purchaseQuantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              disabled={!isInStock()}
            />
          </div>
          
          <button 
            className="btn btn-secondary ms-1"
            onClick={handleAddToCart}
            disabled={!isInStock()}
          >
            {isInStock() ? 'ADD TO CART' : 'SOLD OUT'}
          </button>
          
          {/* Enhanced Farmer Information Card */}
          <div className="farmer-info-card mt-4">
            <div className="farmer-header">
              <div className="farmer-avatar">
                <Avatar 
                  size={64} 
                  src={farmerDetails?.profile_picture || null}
                  icon={!farmerDetails?.profile_picture && <UserOutlined />}
                />
              </div>
              <div className="farmer-details">
                <h4>{product.farmer?.name || "Farmer"}</h4>
                <div className="farmer-rating">
                  <div className="rating-stars">
                    <Rate disabled defaultValue={calculateAverageRating()} />
                  </div>
                  <span>({farmerReviews.length} reviews)</span>
                </div>
              </div>
            </div>
            
            <div className="farmer-actions mt-3">
              <button 
                className="btn btn-primary action-btn"
                onClick={navigateToFarmerProfile}
              >
                View Profile
              </button>
              
              {product.farmer?.phone && (
                <a 
                  className="btn btn-success action-btn" 
                  href={`tel:${product.farmer.phone}`}
                >
                  Call Farmer
                </a>
              )}
              
              <button 
                className="btn btn-info action-btn"
                onClick={openChatModal}
              >
                Chat with Farmer
              </button>
              
              <button 
                className="btn btn-warning action-btn"
                onClick={() => navigate(`/farmer/${product.farmer?._id}#reviews`)}
              >
                See Reviews
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chat Modal */}
      <Modal
        title={`Chat with ${product.farmer?.name || "Farmer"}`}
        open={chatModalVisible}
        onCancel={() => setChatModalVisible(false)}
        footer={null}
        width={600}
      >
        <div className="chat-container">
          {chatLoading ? (
            <div className="text-center p-4">
              <Spin />
            </div>
          ) : (
            <>
              <div className="messages-area">
                {chatMessages.length === 0 ? (
                  <Empty description="No messages yet. Start a conversation!" />
                ) : (
                  chatMessages.map((msg, index) => (
                    <div
                      key={msg._id || index}
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
                <div ref={messagesEndRef} />
              </div>

              <div className="message-input">
                <Form layout="inline" className="message-form">
                  <Form.Item className="message-input-field">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      onPressEnter={sendMessage}
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      onClick={sendMessage}
                      disabled={!messageText.trim()}
                    >
                      Send
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            </>
          )}
        </div>
      </Modal>
      
      <hr />
      <div className="row container similar-products">
        <h4>Similar Products ➡️</h4>
        {relatedProducts.length < 1 && (
          <p className="text-center">No Similar Products found</p>
        )}
        <div className="d-flex flex-wrap">
          {relatedProducts?.map((p) => (
            <div className="card m-2" key={p._id}>
              <img
                src={`/api/v1/produce/produce-photo/${p._id}`}
                className="card-img-top"
                alt={p.name}
                onError={(e) => {
                  e.target.src = '/images/default-product.png';
                }}
              />
              <div className="card-body">
                <div className="card-name-price">
                  <h5 className="card-title">{p.name}</h5>
                  <h5 className="card-title card-price">
                    {p.price.toLocaleString("en-IN", {
                      style: "currency",
                      currency: "INR",
                    })}
                  </h5>
                </div>
                <p className="card-text ">
                  {p.description.substring(0, 60)}...
                </p>
                <div className="card-name-price">
                  <button
                    className="btn btn-info ms-1"
                    onClick={() => navigate(`/product/${p.slug}`)}
                  >
                    More Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetails;
