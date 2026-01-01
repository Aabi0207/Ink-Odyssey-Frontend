import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { format, subDays, startOfYear, endOfYear, subYears, parseISO } from 'date-fns';
import { TrendingUp, Calendar as CalendarIcon, BarChart3, ChevronLeft, ChevronRight, BookOpen, Flame, Activity } from 'lucide-react';
import Navigation from '../Navigation/Navigation';
import './Dashboard.css';

const API_BASE_URL = 'https://aabidon.pythonanywhere.com/api/self-reflection';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(30);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDays]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/reflections/dashboard_stats/?days=${selectedDays}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Format X-axis ticks based on date range
  const formatXAxis = (date) => {
    if (!date) return '';
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    
    if (selectedDays === 7) {
      // For 7 days, show day and date (Mon 1)
      return format(parsedDate, 'EEE d');
    } else if (selectedDays === 30) {
      // For 30 days, show date (Dec 1)
      return format(parsedDate, 'MMM d');
    } else if (selectedDays === 90) {
      // For 90 days, show month (Dec)
      return format(parsedDate, 'MMM');
    } else {
      // For 1 year, show only month (Dec)
      return format(parsedDate, 'MMM');
    }
  };

  // Calculate tick interval based on days
  const getTickInterval = () => {
    if (selectedDays === 7) {
      return 0; // Show all days
    } else if (selectedDays === 30) {
      return 4; // Show every 5th day
    } else if (selectedDays === 90) {
      return 14; // Show every ~15 days
    } else {
      return 29; // Show every ~30 days for 1 year (monthly)
    }
  };

  // Custom tooltip for line charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      if (value === null) return null;
      
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{format(new Date(label), 'MMM dd, yyyy')}</p>
          <p className="tooltip-value">{value}</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for heatmap
  const HeatmapTooltip = ({ date, value, color }) => {
    if (!date || value === null) return null;
    
    return (
      <div className="custom-tooltip heatmap-tooltip">
        <p className="tooltip-date">{format(new Date(date), 'MMM dd, yyyy')}</p>
        <p className="tooltip-value">{value}</p>
      </div>
    );
  };

  // Render range question chart (smooth line with area fill)
  const renderRangeChart = (question) => {
    const chartData = question.line_chart.data.map(item => ({
      date: item.date,
      value: item.value,
      color: item.color
    }));

    const stats = question.line_chart.statistics;

    return (
      <div key={question.question_id} className="chart-card">
        <div className="chart-header">
          <div className="chart-title-section">
            <TrendingUp className="chart-icon" size={20} />
            <div>
              <h3 className="chart-title">{question.question_text}</h3>
              <p className="chart-category">{question.category || 'General'}</p>
            </div>
          </div>
          {stats && stats.count > 0 && (
            <div className="chart-stats">
              <div className="stat-item">
                <span className="stat-label">Avg</span>
                <span className="stat-value">{stats.average}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Min</span>
                <span className="stat-value">{stats.min}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Max</span>
                <span className="stat-value">{stats.max}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Count</span>
                <span className="stat-value">{stats.count}</span>
              </div>
            </div>
          )}
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart 
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`gradient-${question.question_id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2980B9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2980B9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis}
                stroke="#95a5a6"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                interval={getTickInterval()}
                minTickGap={20}
              />
              <YAxis 
                stroke="#95a5a6"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: '#2980B9', strokeWidth: 1, strokeDasharray: '3 3' }}
                animationDuration={0}
                isAnimationActive={false}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#2980B9" 
                strokeWidth={2}
                fill={`url(#gradient-${question.question_id})`}
                dot={{ 
                  fill: '#2980B9', 
                  strokeWidth: 0, 
                  r: 3 
                }}
                activeDot={{ 
                  r: 5, 
                  fill: '#2980B9',
                  stroke: '#fff',
                  strokeWidth: 2,
                  style: { transition: 'all 0.2s ease' }
                }}
                connectNulls={false}
                isAnimationActive={true}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render choice question chart (calendar heatmap)
  const renderChoiceChart = (question) => {
    // Use selected year for heatmap
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 11, 31));
    
    // Create a map of responses by date
    const responseMap = {};
    question.line_chart.datasets.forEach(dataset => {
      dataset.data.forEach(item => {
        if (item.selected) {
          responseMap[item.date] = {
            date: item.date,
            choice: dataset.label,
            color: dataset.color
          };
        }
      });
    });

    // Convert to heatmap format
    const heatmapData = Object.values(responseMap).map(item => ({
      date: item.date,
      count: 1,
      choice: item.choice,
      color: item.color
    }));

    return (
      <div key={question.question_id} className="chart-card">
        <div className="chart-header">
          <div className="chart-title-section">
            <CalendarIcon className="chart-icon" size={20} />
            <div>
              <h3 className="chart-title">{question.question_text}</h3>
              <p className="chart-category">{question.category || 'General'}</p>
            </div>
          </div>
        </div>

        {/* Color Legend */}
        <div className="choice-legend">
          {question.line_chart.datasets.map(dataset => (
            <div key={dataset.label} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: dataset.color }}
              />
              <span className="legend-label">{dataset.label}</span>
            </div>
          ))}
        </div>

        {/* Year Selector */}
        <div className="year-selector">
          <button 
            className="year-nav-button"
            onClick={() => setSelectedYear(selectedYear - 1)}
            aria-label="Previous year"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="year-display">{selectedYear}</span>
          <button 
            className="year-nav-button"
            onClick={() => setSelectedYear(selectedYear + 1)}
            disabled={selectedYear >= new Date().getFullYear()}
            aria-label="Next year"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Calendar Heatmap */}
        <div className="heatmap-container">
          <CalendarHeatmap
            startDate={yearStart}
            endDate={yearEnd}
            values={heatmapData}
            gutterSize={3}
            classForValue={(value) => {
              if (!value || !value.count) {
                return 'color-empty';
              }
              return 'color-filled';
            }}
            tooltipDataAttrs={(value) => {
              if (!value || !value.date) {
                return {};
              }
              return {
                'data-tip': `${format(new Date(value.date), 'MMM dd, yyyy')}: ${value.choice || 'No response'}`
              };
            }}
            transformDayElement={(element, value) => {
              if (value && value.color) {
                return React.cloneElement(element, {
                  style: {
                    ...element.props.style,
                    fill: value.color,
                    opacity: 1
                  }
                });
              }
              return element;
            }}
          />
        </div>

        {/* Distribution */}
        {question.distribution && (
          <div className="distribution-section">
            <h4 className="distribution-title">Choice Distribution</h4>
            <div className="distribution-grid">
              {Object.entries(question.distribution)
                .filter(([_, data]) => data.count > 0)
                .sort(([_, a], [__, b]) => b.count - a.count)
                .map(([choice, data]) => (
                  <div key={choice} className="distribution-item">
                    <div 
                      className="distribution-color" 
                      style={{ backgroundColor: data.color }}
                    />
                    <span className="distribution-label">{choice}</span>
                    <span className="distribution-count">{data.count}x</span>
                    <span className="distribution-percentage">{data.percentage}%</span>
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>
    );
  };

  // Group questions by category and type
  const groupQuestions = (questions) => {
    const grouped = {};
    
    questions.forEach(question => {
      const category = question.category || 'General';
      const questionType = question.question_type;
      
      if (!grouped[category]) {
        grouped[category] = { range: [], choice: [], text: [] };
      }
      
      // Only add if the question type is valid
      if (questionType === 'range' || questionType === 'choice') {
        grouped[category][questionType].push(question);
      }
    });

    return grouped;
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="dashboard">
          <div className="dashboard-loading">
            <div className="loading-spinner"></div>
            <p>Loading your insights...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navigation />
        <div className="dashboard">
          <div className="dashboard-error">
            <p>{error}</p>
            <button onClick={fetchDashboardData} className="retry-button">
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!dashboardData || !dashboardData.questions || dashboardData.questions.length === 0) {
    return (
      <>
        <Navigation />
        <div className="dashboard">
          <div className="dashboard-empty">
            <BarChart3 size={64} strokeWidth={1.5} />
            <h2>No Reflection Data Yet</h2>
            <p>Start adding your daily reflections to see beautiful insights and trends!</p>
          </div>
        </div>
      </>
    );
  }

  const groupedQuestions = groupQuestions(dashboardData.questions);

  return (
    <>
      <Navigation />
      <div className="dashboard">
        <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Reflection Insights</h1>
            <p className="dashboard-subtitle">
              Visualizing {dashboardData.overview.total_reflections} reflections 
              from the last {dashboardData.overview.days_analyzed} days
            </p>
          </div>
          
          {/* Day selector */}
          <div className="day-selector">
            <button 
              className={`day-button ${selectedDays === 7 ? 'active' : ''}`}
              onClick={() => setSelectedDays(7)}
            >
              7 Days
            </button>
            <button 
              className={`day-button ${selectedDays === 30 ? 'active' : ''}`}
              onClick={() => setSelectedDays(30)}
            >
              30 Days
            </button>
            <button 
              className={`day-button ${selectedDays === 90 ? 'active' : ''}`}
              onClick={() => setSelectedDays(90)}
            >
              90 Days
            </button>
            <button 
              className={`day-button ${selectedDays === 365 ? 'active' : ''}`}
              onClick={() => setSelectedDays(365)}
            >
              1 Year
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="overview-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <BookOpen size={24} strokeWidth={2} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Total Reflections</p>
              <p className="stat-number">{dashboardData.overview.total_reflections}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Flame size={24} strokeWidth={2} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Day Streak</p>
              <p className="stat-number">{dashboardData.overview.current_streak}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Activity size={24} strokeWidth={2} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Active Questions</p>
              <p className="stat-number">{dashboardData.questions.length}</p>
            </div>
          </div>
        </div>

        {/* Charts grouped by category */}
        {Object.entries(groupedQuestions).map(([category, questions]) => (
          <div key={category} className="category-section">
            <h2 className="category-title">{category}</h2>
            
            {/* Range Questions */}
            {questions.range.length > 0 && (
              <div className="charts-grid">
                {questions.range.map(question => renderRangeChart(question))}
              </div>
            )}

            {/* Choice Questions */}
            {questions.choice.length > 0 && (
              <div className="charts-grid">
                {questions.choice.map(question => renderChoiceChart(question))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
    </>
  );
};

export default Dashboard;
