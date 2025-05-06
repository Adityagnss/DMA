import React, { useState, useEffect, useCallback } from "react";
import Layout from "../../components/Layout/Layout";
import { useAuth } from "../../context/auth";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { getToken, onMessage } from 'firebase/messaging';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMicrophoneSlash, faBell, faMoneyBillWave, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import { messaging } from '../../firebase';

const FCM_TOKEN_KEY = 'fcm_token';
const TOKEN_EXPIRY_KEY = 'fcm_token_expiry';
const TOKEN_EXPIRY_HOURS = 24;

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const [auth] = useAuth();
  const [produce, setProduce] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    activeListings: 0,
    totalRevenue: 0,
    totalOrders: 0,
    pendingPayments: 0
  });

  const {
    transcript,
    listening,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition({
    commands: [
      {
        command: 'list produce *',
        callback: (name) => handleVoiceCommand('list', name)
      },
      {
        command: 'delete produce *',
        callback: (name) => handleVoiceCommand('delete', name)
      },
      {
        command: 'show orders',
        callback: () => handleVoiceCommand('orders')
      },
      {
        command: 'help',
        callback: () => handleVoiceCommand('help')
      }
    ]
  });

  const handleVoiceCommand = (action, param) => {
    // Provide immediate feedback that command was recognized
    toast.success(`Executing command: ${action}${param ? ` ${param}` : ''}`);

    switch (action) {
      case 'list':
        navigate('/dashboard/farmer/create-produce');
        toast.success('Navigating to create produce page');
        break;
      case 'delete':
        const produceToDelete = produce.find(p => 
          p.name.toLowerCase().includes(param.toLowerCase())
        );
        if (produceToDelete) {
          handleDelete(produceToDelete._id);
          toast.success(`Deleting produce: ${produceToDelete.name}`);
        } else {
          toast.error(`Could not find produce with name containing "${param}"`);
        }
        break;
      case 'orders':
        toast.success('Fetching your orders...');
        getOrders();
        break;
      case 'help':
        toast.success('Available commands:', {
          duration: 5000,
          description: `
            • "list produce [name]" - Create new produce
            • "delete produce [name]" - Delete produce
            • "show orders" - View your orders
            • "help" - Show this help message
          `
        });
        break;
      default:
        toast.error('Unrecognized command. Say "help" to see available commands.');
        break;
    }
  };

  const toggleVoiceRecognition = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      toast.success('Voice input disabled');
    } else {
      if (!browserSupportsSpeechRecognition) {
        toast.error('Browser does not support speech recognition');
        return;
      }
      SpeechRecognition.startListening({ continuous: true });
      toast.success('Voice input enabled. Say "help" to see available commands');
    }
  };

  // Get farmer's produce
  const getFarmerProduce = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/v1/produce/farmer-produce");
      if (data?.success) {
        setProduce(data.produce);
        setLoading(false);
        
        // Calculate stats
        setStats({
          activeListings: data.produce.length,
          totalRevenue: data.produce.reduce((acc, p) => acc + p.price * p.quantity, 0),
          totalOrders: orders.length,
          pendingPayments: orders.filter(o => o.status === "processing").length
        });
      }
    } catch (error) {
      console.log(error);
      toast.error("Error fetching produce listings");
      setLoading(false);
    }
  }, [orders]);

  // Get orders
  const getOrders = async () => {
    try {
      const { data } = await axios.get("/api/v1/orders/farmer-orders");
      setOrders(data);
    } catch (error) {
      console.log(error);
      toast.error("Error fetching orders");
    }
  };

  // Delete produce
  const handleDelete = async (id) => {
    try {
      const { data } = await axios.delete(`/api/v1/produce/delete-produce/${id}`);
      if (data?.success) {
        toast.success("Produce deleted successfully");
        getFarmerProduce();
      }
    } catch (error) {
      console.log(error);
      toast.error("Error deleting produce");
    }
  };

  // Check if FCM token is valid
  const isTokenValid = () => {
    const token = localStorage.getItem(FCM_TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (!token || !expiry) return false;
    
    const expiryDate = new Date(expiry);
    return expiryDate > new Date();
  };

  // Initialize Firebase messaging and cleanup voice recognition
  useEffect(() => {
    const initializeMessaging = async () => {
      try {
        // Check if we already have a valid token
        if (isTokenValid()) {
          // Set up message handler
          onMessage(messaging, (payload) => {
            setNotifications(prev => [payload.notification, ...prev]);
            toast.success(payload.notification.title);
          });
          return;
        }

        // Get new token only if needed
        const token = await getToken(messaging, { vapidKey: process.env.REACT_APP_VAPID_KEY });
        
        // Save token with expiry
        localStorage.setItem(FCM_TOKEN_KEY, token);
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + TOKEN_EXPIRY_HOURS);
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toISOString());
        
        // Register with backend
        await axios.post("/api/v1/notifications/register-device", { token });
        
        // Set up message handler
        onMessage(messaging, (payload) => {
          setNotifications(prev => [payload.notification, ...prev]);
          toast.success(payload.notification.title);
        });
      } catch (error) {
        console.log("Error initializing messaging:", error);
        // Clear invalid token
        localStorage.removeItem(FCM_TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
      }
    };

    initializeMessaging();
    getFarmerProduce();
    getOrders();

    // Cleanup function
    return () => {
      if (listening) {
        SpeechRecognition.stopListening();
      }
    };
  }, [getFarmerProduce, listening]);

  // Update stats when orders change
  useEffect(() => {
    if (produce.length > 0) {
      setStats(prev => ({
        ...prev,
        totalOrders: orders.length,
        pendingPayments: orders.filter(o => o.status === "processing").length
      }));
    }
  }, [orders, produce]);

  return (
    <Layout>
      <div className="container-fluid m-3 p-3">
        <div className="dashboard-header">
          <h2>Welcome, {auth?.user?.name}</h2>
          <div className="d-flex align-items-center">
            <button 
              className={`btn ${listening ? 'btn-danger' : 'btn-primary'} me-3`}
              onClick={toggleVoiceRecognition}
            >
              <FontAwesomeIcon icon={listening ? faMicrophoneSlash : faMicrophone} />
              {' '}
              {listening ? 'Stop Voice Input' : 'Start Voice Input'}
            </button>
            {listening && (
              <div className="voice-feedback me-3">
                <small className="text-muted">{transcript || 'Listening...'}</small>
              </div>
            )}
            <div className="dropdown">
              <button className="btn btn-secondary" type="button" data-bs-toggle="dropdown">
                <FontAwesomeIcon icon={faBell} />
                {notifications.length > 0 && <span className="badge bg-danger">{notifications.length}</span>}
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                {notifications.map((notif, i) => (
                  <li key={i} className="dropdown-item">{notif.title}</li>
                ))}
                {notifications.length === 0 && (
                  <li className="dropdown-item text-muted">No new notifications</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card">
              <div className="card-body">
                <h3>{stats.activeListings}</h3>
                <p>Active Listings</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card">
              <div className="card-body">
                <h3>₹{stats.totalRevenue.toLocaleString('en-IN')}</h3>
                <p>Total Revenue</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card">
              <div className="card-body">
                <h3>{stats.totalOrders}</h3>
                <p>Total Orders</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card">
              <div className="card-body">
                <h3>{stats.pendingPayments}</h3>
                <p>Pending Payments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-4">
          <Link to="/dashboard/farmer/create-produce" className="btn btn-primary me-2">
            List New Produce
          </Link>
          <Link to="/dashboard/farmer/earnings" className="btn btn-success">
            <FontAwesomeIcon icon={faMoneyBillWave} /> Withdraw Earnings
          </Link>
        </div>

        {/* Produce Listings */}
        <div className="row">
          <div className="col-md-12">
            <h3>Your Produce Listings</h3>
            {loading ? (
              <div className="text-center">Loading...</div>
            ) : (
              <div className="row">
                {produce.map((p) => (
                  <div key={p._id} className="col-md-4 mb-3">
                    <div className="card">
                      <img
                        src={`/api/v1/produce/produce-photo/${p._id}`}
                        className="card-img-top"
                        alt={p.name}
                        style={{ height: "200px", objectFit: "cover" }}
                      />
                      <div className="card-body">
                        <h5 className="card-title">{p.name}</h5>
                        <p className="card-text">{p.description.substring(0, 60)}...</p>
                        <p className="card-text">
                          <strong>Price:</strong> ₹{p.price} per {p.unit}
                        </p>
                        <p className="card-text">
                          <strong>Quantity:</strong> {p.quantity} {p.unit}
                        </p>
                        <div className="d-flex justify-content-between">
                          <Link
                            to={`/dashboard/farmer/edit-produce/${p._id}`}
                            className="btn btn-primary"
                          >
                            <FontAwesomeIcon icon={faEdit} /> Edit
                          </Link>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDelete(p._id)}
                          >
                            <FontAwesomeIcon icon={faTrash} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FarmerDashboard;
