import orderModel from "../models/orderModel.js";
import notificationModel from "../models/notificationModel.js";
import earningsModel from "../models/earningsModel.js";
import { sendNotification } from "../services/firebaseService.js";

// Get farmer orders
export const getFarmerOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ "products.farmer": req.user._id })
      .populate("products.product", "name price")
      .populate("buyer", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error getting orders",
      error,
    });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).send({
        success: false,
        message: "Order not found",
      });
    }

    // Verify the farmer owns this order
    const farmerProducts = order.products.filter(p => p.farmer.toString() === req.user._id.toString());
    if (farmerProducts.length === 0) {
      return res.status(403).send({
        success: false,
        message: "Not authorized to update this order",
      });
    }

    // Update status for farmer's products
    order.products = order.products.map(p => {
      if (p.farmer.toString() === req.user._id.toString()) {
        p.status = status;
      }
      return p;
    });

    // If all products are delivered, update payment status
    const allDelivered = order.products.every(p => p.status === "delivered");
    if (allDelivered) {
      // Release payment from escrow
      const earnings = await earningsModel.findOne({ farmer: req.user._id });
      if (earnings) {
        const orderTotal = farmerProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
        earnings.balance += orderTotal;
        earnings.escrowBalance -= orderTotal;
        await earnings.save();

        // Create transaction record
        earnings.transactions.push({
          type: "credit",
          amount: orderTotal,
          description: `Payment released for order #${order._id}`,
          status: "completed",
        });
        await earnings.save();

        // Send notification
        const notification = new notificationModel({
          user: req.user._id,
          title: "Payment Released",
          message: `Payment of ₹${orderTotal} has been released to your account for order #${order._id}`,
          type: "payment",
          relatedId: order._id,
          onModel: "Order",
        });
        await notification.save();

        if (earnings.deviceToken) {
          await sendNotification(earnings.deviceToken, notification.title, notification.message);
        }
      }
    }

    await order.save();

    // Send notification to buyer
    const buyerNotification = new notificationModel({
      user: order.buyer,
      title: "Order Status Updated",
      message: `Your order #${order._id} status has been updated to ${status}`,
      type: "order",
      relatedId: order._id,
      onModel: "Order",
    });
    await buyerNotification.save();

    res.json({
      success: true,
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error updating order status",
      error,
    });
  }
};

// Get farmer sales history
export const getFarmerSalesHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find all orders where this farmer has products
    const orders = await orderModel
      .find({ "products.farmer": id, "products.status": { $in: ["delivered", "completed"] } })
      .populate("products.product", "name price unit")
      .populate("buyer", "name email")
      .sort({ createdAt: -1 });
    
    // Format the orders for display
    const formattedOrders = orders.map(order => {
      // Filter to only include products from this farmer
      const farmerProducts = order.products.filter(p => p.farmer.toString() === id);
      
      return {
        _id: order._id,
        createdAt: order.createdAt,
        buyer: order.buyer,
        products: farmerProducts.map(p => ({
          name: p.product.name,
          price: p.price,
          quantity: p.quantity,
          unit: p.product.unit,
          status: p.status
        })),
        status: farmerProducts[0]?.status || "processing"
      };
    });

    res.status(200).send({
      success: true,
      message: "Farmer sales history fetched successfully",
      orders: formattedOrders
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error getting sales history",
      error
    });
  }
};
