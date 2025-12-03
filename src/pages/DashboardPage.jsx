import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../components/Dashboard/Dashboard';
import './DashboardPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="dashboard-page-loading">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Dashboard />
    </div>
  );
};

export default DashboardPage;
