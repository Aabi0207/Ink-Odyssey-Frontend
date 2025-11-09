import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import Navigation from '../Navigation/Navigation';
import './Calendar.css';

const API_BASE_URL = 'https://aabidon.pythonanywhere.com/api/diary';

const Calendar = () => {
  const { accessToken, logout } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [entriesByDate, setEntriesByDate] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch entries for the current month
  const fetchMonthEntries = async (year, month) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/entries/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const allEntries = data.results || data;
        
        // Group entries by date
        const grouped = {};
        allEntries.forEach(entry => {
          const entryDate = new Date(entry.created_at);
          const dateKey = entryDate.toISOString().split('T')[0];
          
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          grouped[dateKey].push(entry);
        });
        
        setEntriesByDate(grouped);
        setEntries(allEntries);
      } else if (response.status === 401) {
        logout();
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) {
      logout();
      return;
    }
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    fetchMonthEntries(year, month);
  }, [accessToken, currentDate]);

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  // Navigate to previous month
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle day click
  const handleDayClick = (day) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, day);
    const dateString = date.toISOString().split('T')[0];
    navigate(`/diary/${dateString}`);
  };

  // Check if date has entries
  const hasEntries = (day) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, day);
    const dateString = date.toISOString().split('T')[0];
    return entriesByDate[dateString] && entriesByDate[dateString].length > 0;
  };

  // Get entry count for a date
  const getEntryCount = (day) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, day);
    const dateString = date.toISOString().split('T')[0];
    return entriesByDate[dateString]?.length || 0;
  };

  // Check if day is today
  const isToday = (day) => {
    const today = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Create array of day numbers
  const days = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  if (loading && Object.keys(entriesByDate).length === 0) {
    return (
      <div className="calendar-container">
        <Navigation />
        <div className="loading">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <Navigation />
      
      <div className="calendar-content">
        <div className="calendar-header">
          <div className="calendar-header-left">
            <h1 className="calendar-title">
              <BookOpen size={32} style={{ marginRight: '12px' }} />
              My Diary Calendar
            </h1>
            <p className="calendar-subtitle">View and navigate your memories</p>
          </div>
        </div>

        <div className="calendar-card">
          <div className="calendar-controls">
            <button onClick={previousMonth} className="btn btn-icon-control" title="Previous month">
              <ChevronLeft size={20} />
            </button>
            
            <h2 className="current-month">{monthName}</h2>
            
            <button onClick={nextMonth} className="btn btn-icon-control" title="Next month">
              <ChevronRight size={20} />
            </button>
          </div>

          <button onClick={goToToday} className="btn btn-today">
            Today
          </button>

          <div className="calendar-grid">
            {/* Week day headers */}
            {weekDays.map(day => (
              <div key={day} className="calendar-weekday">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {days.map((day, index) => (
              <div
                key={index}
                className={`calendar-day ${day === null ? 'empty' : ''} ${
                  isToday(day) ? 'today' : ''
                } ${hasEntries(day) ? 'has-entries' : ''}`}
                onClick={() => day && handleDayClick(day)}
              >
                {day && (
                  <>
                    <span className="day-number">{day}</span>
                    {hasEntries(day) && (
                      <div className="entry-indicator">
                        <span className="entry-count">{getEntryCount(day)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="calendar-legend">
            <div className="legend-item">
              <div className="legend-dot today-dot"></div>
              <span>Today</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot entries-dot"></div>
              <span>Has Memories</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
