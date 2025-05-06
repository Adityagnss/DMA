import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout/Layout";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import { useNavigate } from "react-router-dom";
import DropIn from "braintree-web-drop-in-react";
import axios from "axios";
import toast from "react-hot-toast";
import "../styles/CartStyles.css";

const CartPage = () => {
  const [auth] = useAuth();
  const [cart, setCart] = useCart();
  const [clientToken, setClientToken] = useState("");
  const [instance, setInstance] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [productStock, setProductStock] = useState({});

  // Fetch current stock levels for all cart items
  const fetchCurrentStock = async () => {
    try {
      const stockData = {};
      // Using Promise.all to efficiently fetch stock for all items in parallel
      await Promise.all(
        cart.map(async (item) => {
          const { data } = await axios.get(`/api/v1/produce/get-produce/${item._id}`);
          if (data?.success) {
            stockData[item._id] = data.produce.quantity || 0;
          }
        })
      );
      setProductStock(stockData);
    } catch (error) {
      console.log("Error fetching stock levels:", error);
    }
  };

  useEffect(() => {
    if (cart.length > 0) {
      fetchCurrentStock();
    }
  }, [cart.length]);

  // Calculate total price with quantities
  const totalPrice = () => {
    try {
      let total = 0;
      cart?.forEach((item) => {
        total = total + (item.price * (item.cartQuantity || 1));
      });
      return total.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
      });
    } catch (error) {
      console.log(error);
      return "₹0";
    }
  };

  // Remove item from cart
  const removeCartItem = (pid) => {
    try {
      let myCart = [...cart];
      let index = myCart.findIndex((item) => item._id === pid);
      myCart.splice(index, 1);
      setCart(myCart);
      localStorage.setItem("cart", JSON.stringify(myCart));
    } catch (error) {
      console.log(error);
    }
  };

  // Update item quantity in cart
  const updateQuantity = (productId, newQuantity) => {
    try {
      // Get current stock for this product
      const currentStock = productStock[productId] || 0;
      
      // Validate new quantity
      if (newQuantity <= 0) {
        toast.error("Quantity must be at least 1");
        return;
      }
      
      if (newQuantity > currentStock) {
        toast.error(`Only ${currentStock} items available in stock`);
        newQuantity = currentStock; // Set to max available
      }
      
      // Update cart
      const updatedCart = cart.map(item => 
        item._id === productId 
          ? { ...item, cartQuantity: newQuantity } 
          : item
      );
      
      setCart(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
    } catch (error) {
      console.log(error);
    }
  };

  // Check if item is out of stock
  const isOutOfStock = (productId) => {
    return (productStock[productId] || 0) <= 0;
  };

  // Get payment gateway token
  const getToken = async () => {
    try {
      const { data } = await axios.get("/api/v1/product/braintree/token");
      setClientToken(data?.clientToken);
    } catch (error) {
      console.log(error);
    }
  };
  
  useEffect(() => {
    getToken();
  }, [auth?.token]);

  // Handle payments
  const handlePayment = async () => {
    try {
      // Verify stock availability before payment
      let stockIssue = false;
      const stockErrors = [];
      
      for (const item of cart) {
        const currentStock = productStock[item._id] || 0;
        if (currentStock < (item.cartQuantity || 1)) {
          stockIssue = true;
          stockErrors.push(`${item.name} - Only ${currentStock} available`);
        }
      }
      
      if (stockIssue) {
        toast.error("Some items are out of stock or quantities have changed");
        stockErrors.forEach(error => toast.error(error));
        fetchCurrentStock(); // Refresh stock data
        return;
      }
      
      setLoading(true);
      const response = await axios.post("/api/v1/product/braintree/payment", {
        cart,
      });
      if (response.data?.success) {
        // Update product quantities after successful payment
        await Promise.all(
          cart.map(async (item) => {
            await axios.put(`/api/v1/produce/update-stock/${item._id}`, {
              quantity: (productStock[item._id] || 0) - (item.cartQuantity || 1)
            });
          })
        );
        
        localStorage.removeItem("cart");
        setCart([]);
        navigate("/dashboard/user/orders");
        toast.success("Payment Completed Successfully");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="cart-page">
        <div className="row">
          <div className="col-md-12">
            <h1 className="text-center bg-light p-2 mb-1">
              {!auth?.user
                ? "Hello Guest"
                : `Hello  ${auth?.token && auth?.user?.name}`}
              <p className="text-center">
                {cart?.length
                  ? `You Have ${cart.length} items in your cart ${
                      auth?.token ? "" : "please login to checkout!"
                    }`
                  : " Your Cart Is Empty"}
              </p>
            </h1>
          </div>
        </div>
        <div className="container">
          <div className="row">
            <div className="col-md-7 p-0 m-0">
              {cart?.map((p) => (
                <div className="item-box">
                  <div className="row single-cart-item">
                    <div className="col-md-2">
                      <img
                        src={`/api/v1/produce/produce-photo/${p._id}`}
                        className="card-img-top"
                        alt={p.name}
                        width="100px"
                        height={"100px"}
                      />
                    </div>
                    <div className="col-md-10">
                      <div className="cart-item-details">
                        <h4 className="card-title">{p.name}</h4>
                        <p className="card-text text-muted">{p.description.substring(0, 60)}...</p>
                        <p>Price: ₹{p.price} per {p.unit}</p>
                        
                        <div className="stock-status mb-2">
                          <span className={isOutOfStock(p._id) ? "text-danger" : "text-success"}>
                            {isOutOfStock(p._id) 
                              ? "Out of Stock" 
                              : `In Stock: ${productStock[p._id] || 0} ${p.unit}`}
                          </span>
                        </div>
                        
                        <div className="quantity-price-box">
                          <div className="quantity-control">
                            <span>Quantity: </span>
                            <div className="input-group input-group-sm">
                              <button 
                                className="btn btn-outline-secondary" 
                                type="button"
                                onClick={() => updateQuantity(p._id, (p.cartQuantity || 1) - 1)}
                                disabled={isOutOfStock(p._id)}
                              >-</button>
                              <input 
                                type="number" 
                                className="form-control text-center"
                                value={p.cartQuantity || 1}
                                onChange={(e) => updateQuantity(p._id, parseInt(e.target.value) || 1)}
                                min="1"
                                max={productStock[p._id] || 0}
                                disabled={isOutOfStock(p._id)}
                              />
                              <button 
                                className="btn btn-outline-secondary" 
                                type="button"
                                onClick={() => updateQuantity(p._id, (p.cartQuantity || 1) + 1)}
                                disabled={isOutOfStock(p._id) || (p.cartQuantity || 1) >= (productStock[p._id] || 0)}
                              >+</button>
                            </div>
                          </div>
                          <div className="subtotal">
                            <span>Subtotal: </span>
                            <strong>₹{(p.price * (p.cartQuantity || 1)).toFixed(2)}</strong>
                          </div>
                          <div className="remove-btn">
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => removeCartItem(p._id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="col-md-5 cart-summary">
              <h2>Cart Summary</h2>
              <p>Total | Checkout | Payment</p>
              <hr />
              <h4>Total: {totalPrice()} </h4>
              {auth?.user?.address ? (
                <>
                  <div className="mb-3">
                    <h4>Current Address</h4>
                    <h5>{auth?.user?.address}</h5>
                    <button
                      className="btn btn-outline-warning"
                      onClick={() => navigate("/dashboard/user/profile")}
                    >
                      Update Address
                    </button>
                  </div>
                </>
              ) : (
                <div className="mb-3">
                  {auth?.token ? (
                    <button
                      className="btn btn-outline-warning"
                      onClick={() => navigate("/dashboard/user/profile")}
                    >
                      Update Address
                    </button>
                  ) : (
                    <button
                      className="btn btn-outline-warning"
                      onClick={() =>
                        navigate("/login", {
                          state: "/cart",
                        })
                      }
                    >
                      Please Login to checkout
                    </button>
                  )}
                </div>
              )}
              <div className="mt-2">
                {!clientToken || !auth?.token || !cart?.length ? (
                  ""
                ) : (
                  <>
                    <DropIn
                      options={{
                        authorization: clientToken,
                        paypal: {
                          flow: "vault",
                        },
                      }}
                      onInstance={(instance) => setInstance(instance)}
                    />

                    <button
                      className="btn btn-primary"
                      onClick={handlePayment}
                      disabled={loading || !instance || !auth?.user?.address || cart.some(item => isOutOfStock(item._id))}
                    >
                      {loading ? "Processing..." : "Make Payment"}
                    </button>
                    {cart.some(item => isOutOfStock(item._id)) && (
                      <p className="text-danger mt-2">
                        Some items in your cart are out of stock. Please remove them to proceed.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
