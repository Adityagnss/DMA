import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './auth';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [auth] = useAuth();
  
  useEffect(() => {
    // Only connect if user is authenticated
    if (auth?.token) {
      // Connect to socket server
      const newSocket = io('http://localhost:8080', {
        withCredentials: true,
      });
      
      setSocket(newSocket);
      
      // Join user's own room for receiving messages
      if (auth?.user?._id) {
        newSocket.emit('join', auth.user._id);
      }
      
      // Cleanup on unmount
      return () => {
        newSocket.disconnect();
      };
    }
    
    return () => {}; // Empty cleanup if no auth
  }, [auth?.token, auth?.user?._id]);
  
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
