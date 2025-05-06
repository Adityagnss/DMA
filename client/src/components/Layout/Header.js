import React, { useEffect, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/auth";
import toast from "react-hot-toast";
import { useCart } from "../../context/cart";
import { Badge } from "antd";
import axios from "axios";
import { MessageOutlined } from "@ant-design/icons";
import "../../styles/HeaderStyles.css";

const Header = () => {
  const [auth, setAuth] = useAuth();
  const [cart] = useCart();
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  
  const handleLogout = () => {
    setAuth({
      ...auth,
      user: null,
      token: "",
    });
    localStorage.removeItem("auth");
    toast.success("Logout Successfully");
  };

  // Helper function to get correct dashboard link based on user type
  const getDashboardLink = () => {
    if (auth?.user?.userType === 'farmer') {
      return '/dashboard/farmer';
    } else if (auth?.user?.userType === 'buyer') {
      return '/dashboard/buyer';
    } else if (auth?.user?.role === 1) {
      return '/dashboard/admin';
    }
    return '/dashboard/user';
  };

  // Fetch unread message count
  const fetchUnreadCount = async () => {
    try {
      if (auth?.token) {
        const { data } = await axios.get('/api/v1/messages/unread-count');
        if (data?.success) {
          setUnreadCount(data.count);
        }
      }
    } catch (error) {
      console.log('Error fetching unread count:', error);
    }
  };

  // Fetch unread count on mount and when auth changes
  useEffect(() => {
    fetchUnreadCount();
    
    // Set up interval to check for new messages
    const interval = setInterval(fetchUnreadCount, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [auth?.token]);

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-body-tertiary fixed-top">
        <div className="container-fluid">
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarTogglerDemo01"
            aria-controls="navbarTogglerDemo01"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="navbarTogglerDemo01">
            <Link to="/" className="navbar-brand">
            🌱 DMA
            </Link>
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <NavLink to="/" className="nav-link">
                  Home
                </NavLink>
              </li>

              {!auth?.user ? (
                <>
                  <li className="nav-item">
                    <NavLink to="/register" className="nav-link">
                      Register
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink to="/login" className="nav-link">
                      Login
                    </NavLink>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <NavLink 
                      to="/messages" 
                      className="nav-link position-relative"
                    >
                      <span className="d-flex align-items-center">
                        <MessageOutlined style={{ fontSize: '16px', marginRight: '5px' }} /> 
                        Messages
                        {unreadCount > 0 && (
                          <Badge 
                            count={unreadCount} 
                            size="small"
                            offset={[5, -5]}
                            style={{ backgroundColor: '#52c41a' }}
                          />
                        )}
                      </span>
                    </NavLink>
                  </li>
                  <li className="nav-item dropdown">
                    <NavLink
                      className="nav-link dropdown-toggle"
                      href="#"
                      role="button"
                      data-bs-toggle="dropdown"
                      style={{ border: "none" }}
                    >
                      {auth?.user?.name}
                    </NavLink>
                    <ul className="dropdown-menu">
                      <li>
                        <NavLink
                          to={getDashboardLink()}
                          className="dropdown-item"
                        >
                          Dashboard
                        </NavLink>
                      </li>
                      <li>
                        <NavLink
                          onClick={handleLogout}
                          to="/login"
                          className="dropdown-item"
                        >
                          Logout
                        </NavLink>
                      </li>
                    </ul>
                  </li>
                </>
              )}
              <li className="nav-item">
                <NavLink to="/cart" className="nav-link">
                  <Badge count={cart?.length} showZero offset={[10, -5]}>
                    Cart
                  </Badge>
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;
