import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import UserMenu from "../../components/Layout/UserMenu";
import { useAuth } from "../../context/auth";
import axios from "axios";
import moment from "moment";

const Dashboard = () => {
  const [auth] = useAuth();
  const [recentOrders, setRecentOrders] = useState([]);

  // Get recent orders
  const getRecentOrders = async () => {
    try {
      const { data } = await axios.get("/api/v1/auth/orders");
      setRecentOrders(data.slice(0, 5)); // Get only the 5 most recent orders
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (auth?.token) getRecentOrders();
  }, [auth?.token]);

  return (
    <Layout title={"Dashboard - Ecommerce App"}>
      <div className="container-fluid m-3 p-3 dashboard">
        <div className="row">
          <div className="col-md-3">
            <UserMenu />
          </div>
          <div className="col-md-9">
            <div className="card w-75 p-3 mb-4">
              <h3>User Profile</h3>
              <hr />
              <p><strong>Name:</strong> {auth?.user?.name}</p>
              <p><strong>Email:</strong> {auth?.user?.email}</p>
              <p><strong>Address:</strong> {auth?.user?.address}</p>
            </div>

            <div className="card w-75 p-3">
              <h3>Recent Orders</h3>
              <hr />
              {recentOrders?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Order Date</th>
                        <th>Payment</th>
                        <th>Quantity</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order, index) => (
                        <tr key={order._id}>
                          <td>{index + 1}</td>
                          <td>{moment(order.createdAt).format("MMMM Do YYYY")}</td>
                          <td>{order.payment.success ? "Success" : "Failed"}</td>
                          <td>{order.products.length}</td>
                          <td>
                            <span className={`badge ${
                              order.status === "Delivered" ? "bg-success" :
                              order.status === "Processing" ? "bg-warning" :
                              order.status === "Shipped" ? "bg-info" : "bg-secondary"
                            }`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No recent orders found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
