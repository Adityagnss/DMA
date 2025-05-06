import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import productRoutes from "./routes/productRoutes.js";
import produceRoutes from "./routes/produceRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import earningsRoutes from "./routes/earningsRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

//configure env
dotenv.config();

//database config
connectDB();

//rest object
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:8081", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Join a room based on userId
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${socket.id} joined room: ${userId}`);
  });
  
  // Handle private messages
  socket.on("private_message", (data) => {
    console.log(`Private message from ${data.senderId} to ${data.receiverId}`);
    // Emit to receiver's room
    io.to(data.receiverId).emit("receive_message", data);
  });
  
  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

//middlewares
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan("dev"));

//routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/produce", produceRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/earnings", earningsRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/review", reviewRoutes);
app.use("/api/v1/reservations", reservationRoutes);

//rest api
app.get("/", (req, res) => {
  res.send("<h1>Welcome to ecommerce app</h1>");
});

//PORT
const PORT = process.env.PORT || 8080;

//run listen
server.listen(PORT, () => {
  console.log(
    `Server Running on ${process.env.DEV_MODE} mode on port ${PORT}`.bgCyan
      .white
  );
});
