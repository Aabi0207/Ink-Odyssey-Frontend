import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import "./Register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    password2: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate passwords match
    if (formData.password !== formData.password2) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("https://aabidon.pythonanywhere.com/api/auth/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          password: formData.password,
          password2: formData.password2,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Registration successful! Redirecting...");
        // Store tokens
        localStorage.setItem("accessToken", data.tokens.access);
        localStorage.setItem("refreshToken", data.tokens.refresh);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      } else {
        // Handle validation errors
        if (data.email) {
          setError(`Email: ${data.email[0]}`);
        } else if (data.password) {
          setError(`Password: ${data.password[0]}`);
        } else if (data.first_name) {
          setError(`First Name: ${data.first_name[0]}`);
        } else if (data.last_name) {
          setError(`Last Name: ${data.last_name[0]}`);
        } else {
          setError("Registration failed. Please try again.");
        }
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container-container">
      <div className="register-container">
        {/* Left Section - Form */}
        <div className="register-form-section">
          <div className="register-form-wrapper">
            <div className="register-logo">
              <img src="/logo.png" alt="Ink Odyssey Logo" />
            </div>

            <div className="register-header">
              <h1 className="register-title">Create an account</h1>
            </div>

            {error && <div className="register-error-message">{error}</div>}

            {success && (
              <div className="register-success-message">{success}</div>
            )}

            <form className="register-form" onSubmit={handleSubmit}>
              <div className="register-input-row">
                <div className="register-input-group">
                  <label htmlFor="firstName" className="register-label">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    className="register-input"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="register-input-group">
                  <label htmlFor="lastName" className="register-label">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    className="register-input"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="register-input-group">
                <label htmlFor="email" className="register-label">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="register-input"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="register-input-group">
                <label htmlFor="password" className="register-label">
                  Password
                </label>
                <div className="register-password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    className="register-input"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="register-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="register-input-group">
                <label htmlFor="password2" className="register-label">
                  Confirm Password
                </label>
                <div className="register-password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password2"
                    name="password2"
                    className="register-input"
                    placeholder="Confirm your password"
                    value={formData.password2}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="register-submit-btn"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>

              <div className="register-footer">
                <a href="/login" className="register-link">
                  Have an account? Sign in
                </a>
              </div>
            </form>
          </div>
        </div>

        {/* Right Section - Image & Overlay */}
        <div className="register-image-section">
          <div className="register-image-wrapper">
            <img 
              src="/register.jpg" 
              alt="Registration" 
              className="register-background-image"
            />
            <div className="register-quote-overlay">
              <p className="register-quote-text">
                "Life isn't about reaching the destination — it's about collecting the stories along the way."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
