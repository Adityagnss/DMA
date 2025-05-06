import React, { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout/Layout";
import { useNavigate } from "react-router-dom";
import { Radio, Card, Row, Col, Button, Image, Badge } from "antd";
import { Prices } from "../components/Prices";
import axios from "axios";
import { useAuth } from "../context/auth";
import toast from "react-hot-toast"; 
import { useCart } from "../context/cart";
import "../styles/Homepage.css";

const { Meta } = Card;

const HomePage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [radio, setRadio] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Check if product is already in cart or out of stock
  const isProductAvailable = (product) => {
    if (!product || product.quantity <= 0) return false;
    
    // Check if this product is in cart and if adding more would exceed the limit
    const cartItem = cart.find(item => item._id === product._id);
    if (cartItem) {
      const cartQuantity = cartItem.cartQuantity || 1;
      return cartQuantity < product.quantity;
    }
    
    // Product not in cart, so it's available
    return true;
  };

  // Add product to cart with validation
  const addToCart = (product) => {
    // Check if product is already in cart
    const existingProduct = cart.find(item => item._id === product._id);
    
    // If product is in cart, verify quantity before adding more
    if (existingProduct) {
      const currentQuantity = existingProduct.cartQuantity || 1;
      if (currentQuantity >= product.quantity) {
        toast.error("Cannot add more. Stock limit reached!");
        return;
      }
      
      // Update quantity in cart
      const updatedCart = cart.map(item => 
        item._id === product._id 
          ? { ...item, cartQuantity: currentQuantity + 1 } 
          : item
      );
      
      setCart(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      toast.success("Added to cart");
    } else {
      // Add new product with quantity 1
      const updatedCart = [...cart, { ...product, cartQuantity: 1 }];
      setCart(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      toast.success("Added to cart");
    }
  };

  const getAllProduce = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/v1/produce/get-produce`);
      if (data?.success) {
        setProducts(data.produce);
        setTotal(data.total);
      }
      setLoading(false);
    } catch (error) {
      console.log(error);
      toast.error("Error loading products");
      setLoading(false);
    }
  };

  const filterProduce = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.post("/api/v1/produce/filter-produce", {
        radio,
      });
      if (data?.success) {
        setProducts(data.produce);
      }
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }, [radio]);

  useEffect(() => {
    if (!radio.length) getAllProduce();
  }, [radio]);

  useEffect(() => {
    if (radio.length) filterProduce();
  }, [radio, filterProduce]);

  return (
    <Layout title={"DMA - All Products"}>
      <div className="banner-container">
        <Image
          src="/images/farm3.jpg"
          alt="Fresh Farm Products"
          preview={false}
          className="banner-img"
        />
        <div className="banner-text">
          <h1>Direct Market Access</h1>
          <p>Fresh from Farm to Your Table</p>
        </div>
      </div>

      <div className="container-fluid mt-4">
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={24} md={6} lg={6}>
            <Card title="Filter Products" className="filter-card">
              <div className="filter-section">
                <h5>Price Range</h5>
                <Radio.Group onChange={(e) => setRadio(e.target.value)}>
                  {Prices?.map((p) => (
                    <div key={p._id} className="mb-2">
                      <Radio value={p.array}>{p.name}</Radio>
                    </div>
                  ))}
                </Radio.Group>
              </div>

              <Button 
                type="primary" 
                danger 
                block
                onClick={() => {
                  setRadio([]);
                }}
              >
                Reset Filters
              </Button>
            </Card>
          </Col>

          <Col xs={24} sm={24} md={18} lg={18}>
            <h2 className="text-center mb-4">Featured Products</h2>
            {loading ? (
              <div className="text-center">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <Row gutter={[16, 16]}>
                {products?.map((p) => (
                  <Col xs={24} sm={12} md={8} lg={8} key={p._id}>
                    <Badge.Ribbon 
                      text={p.quantity > 0 ? `${p.quantity} ${p.unit} available` : "Out of Stock"} 
                      color={p.quantity > 0 ? "green" : "red"}
                    >
                      <div className="product-card-container">
                        <Card
                          hoverable
                          cover={
                            <div className="product-image-container">
                              <img
                                alt={p.name}
                                src={`/api/v1/produce/produce-photo/${p._id}`}
                                style={{ height: 200, objectFit: "cover" }}
                                onError={(e) => {
                                  e.target.src = '/images/default-product.png';
                                }}
                              />
                              {/* Out of stock overlay */}
                              {!isProductAvailable(p) && (
                                <div className="out-of-stock-overlay">
                                  <span>OUT OF STOCK</span>
                                </div>
                              )}
                            </div>
                          }
                          actions={[
                            <Button 
                              type="link" 
                              onClick={() => {
                                // Use slug if available, otherwise use ID as fallback
                                if (p.slug) {
                                  navigate(`/product/${p.slug}`);
                                } else {
                                  navigate(`/product/${p._id}`);
                                }
                              }}
                            >
                              More Details
                            </Button>,
                            <Button
                              type="primary"
                              onClick={() => addToCart(p)}
                              disabled={!isProductAvailable(p)}
                              className={!isProductAvailable(p) ? "sold-out-button" : ""}
                            >
                              {isProductAvailable(p) ? "Add to Cart" : "Sold Out"}
                            </Button>
                          ]}
                        >
                          <Card.Meta
                            title={p.name}
                            description={
                              <>
                                <p>{p.description.substring(0, 60)}...</p>
                                <p>Category: {p.category}</p>
                                <div className="product-price-box">
                                  <div>
                                    <span>Price: </span>
                                    <strong>₹{p.price} per {p.unit}</strong>
                                  </div>
                                  <div className={`stock-status ${p.quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                                    {p.quantity > 0 ? 'In Stock' : 'Sold Out'}
                                  </div>
                                </div>
                                <p>Farmer: {p.farmer?.name}</p>
                              </>
                            }
                          />
                        </Card>
                      </div>
                    </Badge.Ribbon>
                  </Col>
                ))}
              </Row>
            )}
          </Col>
        </Row>
      </div>
    </Layout>
  );
};

export default HomePage;
