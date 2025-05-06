import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import { useAuth } from "../../context/auth";
import axios from "axios";
import toast from "react-hot-toast";

const BuyerDashboard = () => {
  const [auth] = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get all products
  const getAllProducts = async () => {
    try {
      const { data } = await axios.get("/api/v1/product/get-product");
      setProducts(data.products);
      setLoading(false);
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllProducts();
  }, []);

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2 className="dashboard-title">Welcome, {auth?.user?.name}</h2>
          <p className="dashboard-subtitle">Find and purchase quality produce directly from farmers</p>
        </div>

        {/* Products Grid */}
        <div className="row">
          {loading ? (
            <div className="col-12 text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            products.map((p) => (
              <div key={p._id} className="col-md-4 mb-4">
                <div className="card product-card h-100">
                  <img
                    src={`/api/v1/product/product-photo/${p._id}`}
                    className="card-img-top product-img"
                    alt={p.name}
                  />
                  <div className="card-body">
                    <h5 className="product-title">{p.name}</h5>
                    <p className="product-meta">{p.description.substring(0, 60)}...</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="product-price">₹{p.price}</span>
                      <span className="badge bg-success">{p.quantity} kg available</span>
                    </div>
                  </div>
                  <div className="card-footer bg-white border-top-0">
                    <button className="btn btn-primary w-100">Contact Farmer</button>
                  </div>
                </div>
              </div>
            ))
          )}
          {!loading && products.length === 0 && (
            <div className="col-12 text-center">
              <p>No products available at the moment</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BuyerDashboard;
