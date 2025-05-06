import mongoose from "mongoose";
import colors from "colors";
const connectDB = async () => {
  try {
    const conn = await mongoose.connect("mongodb+srv://ng4521:vdaL9l1VNGyFPuG3@cluster0.nlgj2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
    console.log(
      `Connected To MongoDB Database ${conn.connection.host}`.bgMagenta.white
    );
  } catch (error) {
    console.log(`Error in MongoDB ${error}`.bgRed.white);
  }
};

export default connectDB;
