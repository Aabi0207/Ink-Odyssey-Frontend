import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        setSuccessMessage('Login successful! Redirecting...');
        setFormData({ email: '', password: '' });
        setTimeout(() => {
          navigate('/diary/');
        }, 1000);
      } else {
        setErrors({ general: result.error || 'Login failed. Please check your credentials.' });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container-container">
      <div className="login-container">
        {/* Left Section - Image Area */}
        <div className="login-image-section">
          <div className="login-image-wrapper">
            <img 
              src="/login.jpg" 
              alt="Login Background" 
              className="login-background-image"
            />
            <div className="login-quote-overlay">
              <p className="login-quote-text">
                "Each new day is a blank page in the diary of your life. The secret of success is in turning that diary into the best story you possibly can."
              </p>
            </div>
          </div>
        </div>

        {/* Right Section - Form Area */}
        <div className="login-form-section">
          <div className="login-form-wrapper">
            <div className="login-logo">
              <img src="/logo.png" alt="Ink Odyssey Logo" />
            </div>

            <div className="login-header">
              <h1 className="login-title">Welcome Back</h1>
              <p className="login-subtitle">Sign in to continue your journey</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {errors.general && (
                <div className="login-error-message">
                  {errors.general}
                </div>
              )}

              {successMessage && (
                <div className="login-success-message">
                  {successMessage}
                </div>
              )}

              {/* Email Field */}
              <div className="login-input-group">
                <label htmlFor="email" className="login-label">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="login-input"
                  placeholder="Enter your email"
                  autoComplete="email"
                />
                {errors.email && (
                  <span className="login-error-text">{errors.email}</span>
                )}
              </div>

              {/* Password Field */}
              <div className="login-input-group">
                <label htmlFor="password" className="login-label">
                  Password
                </label>
                <div className="login-password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="login-input"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="login-error-text">{errors.password}</span>
                )}
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="login-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>

              {/* Footer Links */}
              <div className="login-footer">
                <a href="/forgot-password" className="login-link">
                  Forgot password?
                </a>
                <div className="login-terms">
                  <span style={{ color: '#7F8C8D', fontSize: '0.9rem' }}>
                    Don't have an account?{' '}
                  </span>
                  <a href="/register" className="login-link">
                    Sign up
                  </a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
