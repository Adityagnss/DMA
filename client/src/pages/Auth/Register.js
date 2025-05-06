import React, { useState } from "react";
import Layout from "./../../components/Layout/Layout";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../../styles/AuthStyles.css";
import { auth, provider } from "../../firebase";
import { signInWithPopup } from "firebase/auth";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [answer, setAnswer] = useState("");
  const [userType, setUserType] = useState("buyer"); // Default to buyer
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/v1/auth/register", {
        name,
        email,
        password,
        phone,
        address,
        answer,
        userType,
      });
      if (res && res.data.success) {
        toast.success(res.data && res.data.message);
        navigate("/login");
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const res = await axios.post("/api/v1/auth/google-register", {
        name: result.user.displayName,
        email: result.user.email,
        userType,
      });
      if (res && res.data.success) {
        toast.success(res.data.message);
        navigate("/login");
      }
    } catch (error) {
      console.log("Google Sign-In Failed:", error);
      toast.error("Google sign-in failed");
    }
  };

  return (
    <Layout title="Register - DMA">
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <h4 className="title">REGISTER FORM</h4>
          <div className="mb-3">
            <label className="form-label">Register As</label>
            <select
              className="form-control"
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
            >
              <option value="buyer">Buyer</option>
              <option value="farmer">Farmer</option>
            </select>
          </div>
          <div className="mb-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-control"
              placeholder="Enter Your Name"
              required
              autoFocus
            />
          </div>
          <div className="mb-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control"
              placeholder="Enter Your Email"
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              placeholder="Enter Your Password"
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="form-control"
              placeholder="Enter Your Phone"
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="form-control"
              placeholder="Enter Your Address"
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="form-control"
              placeholder="What is your favorite sport?"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            REGISTER
          </button>
          <div className="mt-3">
            <button
              type="button"
              className="btn btn-danger w-100"
              onClick={handleGoogleSignIn}
            >
              Register with Google
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default Register;
