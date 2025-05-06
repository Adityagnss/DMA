import React, { useState, useRef, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import toast from "react-hot-toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faImage } from "@fortawesome/free-solid-svg-icons";

const CreateProduce = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
    unit: "kg", // default unit
    category: "",
    photo: null,
  });
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePhotoChange = (e) => {
    setFormData({
      ...formData,
      photo: e.target.files[0],
    });
  };

  useEffect(() => {
    // Cleanup function to stop camera when component unmounts
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    // Handle camera stream when showCamera state changes
    if (showCamera) {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
          }
        } catch (error) {
          console.error("Error accessing camera:", error);
          toast.error("Could not access camera");
          setShowCamera(false);
        }
      };
      startCamera();
    } else {
      // Stop the camera stream when showCamera is false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    }
  }, [showCamera]);

  const toggleCamera = () => {
    setShowCamera(prev => !prev);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
      setFormData(prev => ({
        ...prev,
        photo: file,
      }));
      setShowCamera(false);
    }, "image/jpeg");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const produceFormData = new FormData();
      produceFormData.append("name", formData.name);
      produceFormData.append("description", formData.description);
      produceFormData.append("price", formData.price);
      produceFormData.append("quantity", formData.quantity);
      produceFormData.append("unit", formData.unit);
      produceFormData.append("category", formData.category);
      if (formData.photo) {
        produceFormData.append("photo", formData.photo);
      }

      const { data } = await axios.post(
        "/api/v1/produce/create-produce",
        produceFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (data?.success) {
        toast.success("Produce listed successfully");
        navigate("/dashboard/farmer");
      } else {
        toast.error(data?.message || "Something went wrong");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container-fluid m-3 p-3">
        <div className="row">
          <div className="col-md-8 offset-md-2">
            <div className="card">
              <div className="card-header">
                <h3>List New Produce</h3>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Price (₹)</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="row mb-3">
                    <div className="col">
                      <label className="form-label">Quantity</label>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="col">
                      <label className="form-label">Unit</label>
                      <select
                        name="unit"
                        value={formData.unit}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      >
                        <option value="kg">Kilogram (kg)</option>
                        <option value="g">Gram (g)</option>
                        <option value="l">Liter (l)</option>
                        <option value="piece">Piece</option>
                        <option value="dozen">Dozen</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="vegetables">Vegetables</option>
                      <option value="fruits">Fruits</option>
                      <option value="grains">Grains</option>
                      <option value="dairy">Dairy</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Photo</label>
                    <div className="d-flex gap-2 mb-2">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={toggleCamera}
                      >
                        <FontAwesomeIcon icon={faCamera} className="me-2" />
                        {showCamera ? "Stop Camera" : "Take Photo"}
                      </button>
                      <div className="position-relative">
                        <input
                          type="file"
                          name="photo"
                          onChange={handlePhotoChange}
                          className="form-control"
                          accept="image/*"
                          id="photo-input"
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => document.getElementById('photo-input').click()}
                        >
                          <FontAwesomeIcon icon={faImage} className="me-2" />
                          Choose File
                        </button>
                      </div>
                    </div>
                    {showCamera && (
                      <div className="position-relative mb-3">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          style={{ width: '100%', maxWidth: '500px' }}
                        />
                        <button
                          type="button"
                          className="btn btn-primary position-absolute top-50 start-50 translate-middle"
                          onClick={capturePhoto}
                        >
                          Capture
                        </button>
                      </div>
                    )}
                    {formData.photo && !showCamera && (
                      <div className="mb-3">
                        <img
                          src={URL.createObjectURL(formData.photo)}
                          alt="Preview"
                          style={{ maxWidth: "200px" }}
                          className="mt-2"
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "List Produce"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateProduce;
