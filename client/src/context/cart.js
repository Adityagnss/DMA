import { useState, useContext, createContext, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "./auth";

const CartContext = createContext();

const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [auth] = useAuth();
  
  // Load cart from localStorage on mount
  useEffect(() => {
    let existingCartItem = localStorage.getItem("cart");
    if (existingCartItem) {
      const parsedCart = JSON.parse(existingCartItem);
      setCart(parsedCart);
      
      // If user is logged in, sync cart with reservations
      if (auth?.token) {
        syncCartWithReservations(parsedCart);
      }
    }
  }, [auth?.token]);
  
  // Sync cart items with server-side reservations
  const syncCartWithReservations = async (cartItems) => {
    try {
      // Only proceed if user is logged in and cart has items
      if (!auth?.token || !cartItems.length) return;
      
      // Create/update reservations for each cart item
      await Promise.all(
        cartItems.map(async (item) => {
          await axios.put(`/api/v1/reservations/update/${item._id}`, {
            quantity: item.quantity
          });
        })
      );
    } catch (error) {
      console.log("Error syncing cart with reservations:", error);
    }
  };
  
  // Add to cart with reservation
  const addToCart = useCallback(async (product, quantity) => {
    try {
      // Check available stock first
      const stockResponse = await axios.get(`/api/v1/reservations/available-stock/${product._id}`);
      const availableStock = stockResponse.data.availableStock + stockResponse.data.userReservation;
      
      if (quantity > availableStock) {
        toast.error(`Only ${availableStock} units available`);
        return false;
      }
      
      // If user is logged in, create/update reservation
      if (auth?.token) {
        const reservationResponse = await axios.put(`/api/v1/reservations/update/${product._id}`, {
          quantity
        });
        
        if (!reservationResponse.data.success) {
          toast.error(reservationResponse.data.message);
          return false;
        }
      }
      
      // Check if product already in cart
      const existingItem = cart.find((item) => item._id === product._id);
      let updatedCart;
      
      if (existingItem) {
        // Update existing item quantity
        updatedCart = cart.map((item) => 
          item._id === product._id ? { ...item, quantity } : item
        );
      } else {
        // Add new item to cart
        updatedCart = [...cart, { ...product, quantity }];
      }
      
      setCart(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      return true;
    } catch (error) {
      console.log("Error adding to cart:", error);
      toast.error("Failed to add to cart");
      return false;
    }
  }, [cart, auth?.token]);
  
  // Remove from cart and cancel reservation
  const removeFromCart = useCallback(async (productId) => {
    try {
      // If user is logged in, cancel reservation
      if (auth?.token) {
        await axios.delete(`/api/v1/reservations/cancel/${productId}`);
      }
      
      const updatedCart = cart.filter((item) => item._id !== productId);
      setCart(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
    } catch (error) {
      console.log("Error removing from cart:", error);
      toast.error("Failed to remove from cart");
    }
  }, [cart, auth?.token]);

  return (
    <CartContext.Provider 
      value={[
        cart, 
        setCart, 
        addToCart,
        removeFromCart
      ]}
    >
      {children}
    </CartContext.Provider>
  );
};

// custom hook
const useCart = () => useContext(CartContext);

export { useCart, CartProvider };
