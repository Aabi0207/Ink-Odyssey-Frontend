import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { format, startOfYear, endOfYear, parseISO } from 'date-fns';
import {
  TrendingUp, TrendingDown, Minus, Calendar as CalendarIcon,
  BarChart3, ChevronLeft, ChevronRight, BookOpen, Flame,
  Activity, Target
} from 'lucide-react';
import Navigation from '../Navigation/Navigation';
import './Dashboard.css';

const API_BASE_URL = 'https://aabidon.pythonanywhere.com/api/self-reflection';

const addGapSegments = (data, key = 'value') => {
  const dataWithGaps = data.map(item => ({ ...item }));
  const gapKeys = [];

  for (let start = 0; start < data.length - 1; start += 1) {
    const hasValue = data[start][key] !== null && data[start][key] !== undefined;
    const nextHasValue = data[start + 1][key] !== null && data[start + 1][key] !== undefined;
    if (!hasValue || nextHasValue) {
      continue;
    }

    let end = start + 1;
    while (end < data.length && (data[end][key] === null || data[end][key] === undefined)) {
      end += 1;
    }

    if (end < data.length) {
      const gapKey = `gap-${gapKeys.length}`;
      gapKeys.push(gapKey);
      dataWithGaps[start][gapKey] = data[start][key];
      dataWithGaps[end][gapKey] = data[end][key];
      start = end - 1;
    }
  }

  return { data: dataWithGaps, gapKeys };
};

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
    if (selectedDays === 7) return format(parsedDate, 'EEE d');
    else if (selectedDays === 30) return format(parsedDate, 'MMM d');
    else if (selectedDays === 90) return format(parsedDate, 'MMM');
    else return format(parsedDate, 'MMM');
  };

  const getTickInterval = () => {
    if (selectedDays === 7) return 0;
    else if (selectedDays === 30) return 4;
    else if (selectedDays === 90) return 14;
    else return 29;
  };

  // Smart Y-axis: hug the data with padding — no forced 0 baseline
  const getYDomain = (data, key = 'value', paddingPercent = 0.18) => {
    const values = data.map(d => d[key]).filter(v => v !== null && v !== undefined);
    if (!values.length) return ['auto', 'auto'];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const pad = range * paddingPercent;
    const lo = Math.max(0, parseFloat((min - pad).toFixed(2)));
    const hi = parseFloat((max + pad).toFixed(2));
    return [lo, hi];
  };

  // Calculate trend: compares recent half vs older half
  const getTrend = (data, key = 'value') => {
    const values = data.map(d => d[key]).filter(v => v !== null && v !== undefined);
    if (values.length < 4) return null;
    const half = Math.floor(values.length / 2);
    const recent = values.slice(-half);
    const older = values.slice(0, half);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    const diff = recentAvg - olderAvg;
    const pct = olderAvg !== 0 ? Math.abs((diff / olderAvg) * 100) : 0;
    return {
      direction: diff > 0.1 ? 'up' : diff < -0.1 ? 'down' : 'flat',
      pct: pct.toFixed(1)
    };
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const valueEntry = payload.find(item => item.dataKey === 'value') || payload[0];
      const value = valueEntry.value;
      if (value === null || value === undefined) return null;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{format(new Date(label), 'MMM dd, yyyy')}</p>
          <p className="tooltip-value">{value}</p>
        </div>
      );
    }
    return null;
  };

  // Trend badge
  const TrendBadge = ({ trend }) => {
    if (!trend) return null;
    if (trend.direction === 'up') {
      return (
        <span className="trend-badge trend-up">
          <TrendingUp size={12} strokeWidth={2.5} />
          +{trend.pct}%
        </span>
      );
    }
    if (trend.direction === 'down') {
      return (
        <span className="trend-badge trend-down">
          <TrendingDown size={12} strokeWidth={2.5} />
          -{trend.pct}%
        </span>
      );
    }
    return (
      <span className="trend-badge trend-flat">
        <Minus size={12} strokeWidth={2.5} />
        Stable
      </span>
    );
  };

  // ── RANGE CHART ──────────────────────────────────────────────────────────────
  const renderRangeChart = (question) => {
    const rawChartData = question.line_chart.data.map(item => ({
      date: item.date,
      value: item.value,
      color: item.color
    }));
    const { data: chartData, gapKeys } = addGapSegments(rawChartData);
    const stats = question.line_chart.statistics;
    const yDomain = getYDomain(chartData);
    const trend = getTrend(chartData);

    // Distribution data for segmented bar
    const distData = question.distribution
      ? Object.entries(question.distribution)
          .map(([label, d]) => ({ label, count: d.count, pct: d.percentage, color: d.color }))
          .sort((a, b) => Number(a.label) - Number(b.label))
      : [];
    const totalDist = distData.reduce((s, d) => s + d.count, 0);

    return (
      <div key={question.question_id} className="chart-card">
        <div className="chart-header">
          <div className="chart-title-section">
            <div className="chart-icon-wrap chart-icon-wrap--range">
              <TrendingUp size={17} />
            </div>
            <div>
              <h3 className="chart-title">{question.question_text}</h3>
              <p className="chart-category">{question.category || 'General'}</p>
            </div>
          </div>
          <div className="chart-header-right">
            {trend && <TrendBadge trend={trend} />}
            {stats && stats.count > 0 && (
              <div className="chart-stats">
                {[
                  { l: 'Avg', v: stats.average },
                  { l: 'Min', v: stats.min },
                  { l: 'Max', v: stats.max },
                  { l: 'Entries', v: stats.count },
                ].map(({ l, v }) => (
                  <div key={l} className="stat-pill">
                    <span className="stat-pill-label">{l}</span>
                    <span className="stat-pill-value">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-r-${question.question_id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e81123" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#e81123" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="#f1f3f5" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                stroke="transparent"
                tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Poppins, sans-serif' }}
                tickLine={false}
                axisLine={false}
                interval={getTickInterval()}
                minTickGap={20}
              />
              <YAxis
                stroke="transparent"
                tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Poppins, sans-serif' }}
                tickLine={false}
                axisLine={false}
                domain={yDomain}
                width={44}
                tickMargin={4}
              />
              {stats && stats.average != null && (
                <ReferenceLine
                  y={stats.average}
                  stroke="#e81123"
                  strokeDasharray="5 3"
                  strokeOpacity={0.35}
                  label={{ value: `avg ${stats.average}`, fill: '#e8112399', fontSize: 10, position: 'insideTopRight' }}
                />
              )}
              {gapKeys.map(gapKey => (
                <Line
                  key={`${question.question_id}-${gapKey}`}
                  type="monotone"
                  dataKey={gapKey}
                  stroke="#e81123"
                  strokeWidth={2.5}
                  strokeDasharray="1 5"
                  strokeLinecap="round"
                  dot={false}
                  activeDot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: '#e8112330', strokeWidth: 1 }}
                animationDuration={0}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#e81123"
                strokeWidth={2.5}
                fill={`url(#grad-r-${question.question_id})`}
                dot={false}
                activeDot={{ r: 5, fill: '#e81123', stroke: '#fff', strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={true}
                animationDuration={900}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Segmented distribution bar */}
        {totalDist > 0 && (
          <div className="dist-bar-section">
            <p className="dist-bar-label">Distribution</p>
            <div className="dist-bar-track">
              {distData
                .filter(d => d.count > 0)
                .map(d => (
                  <div
                    key={d.label}
                    className="dist-bar-segment"
                    style={{ width: `${d.pct}%`, backgroundColor: d.color || '#e81123' }}
                    title={`${d.label}: ${d.count} (${d.pct}%)`}
                  />
                ))}
            </div>
            <div className="dist-bar-legend">
              {distData
                .filter(d => d.count > 0)
                .map(d => (
                  <span key={d.label} className="dist-legend-item">
                    <span className="dist-legend-dot" style={{ backgroundColor: d.color || '#e81123' }} />
                    <span className="dist-legend-text">{d.label}</span>
                    <span className="dist-legend-pct">{d.pct}%</span>
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── NUMBER CHART ─────────────────────────────────────────────────────────────
  const renderNumberChart = (question) => {
    const rawChartData = question.line_chart.data.map(item => ({
      date: item.date,
      value: item.value
    }));
    const { data: chartData, gapKeys } = addGapSegments(rawChartData);
    const stats = question.line_chart.statistics;
    const yDomain = getYDomain(chartData);
    const trend = getTrend(chartData);

    return (
      <div key={question.question_id} className="chart-card number-chart">
        <div className="chart-header">
          <div className="chart-title-section">
            <div className="chart-icon-wrap chart-icon-wrap--number">
              <BarChart3 size={17} />
            </div>
            <div>
              <h3 className="chart-title">{question.question_text}</h3>
              <p className="chart-category">{question.category || 'General'}</p>
            </div>
          </div>
          <div className="chart-header-right">
            {trend && <TrendBadge trend={trend} />}
            {stats && stats.count > 0 && (
              <div className="chart-stats">
                {[
                  { l: 'Avg', v: stats.average },
                  { l: 'Min', v: stats.min },
                  { l: 'Max', v: stats.max },
                  { l: 'Entries', v: stats.count },
                ].map(({ l, v }) => (
                  <div key={l} className="stat-pill stat-pill--teal">
                    <span className="stat-pill-label">{l}</span>
                    <span className="stat-pill-value">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-n-${question.question_id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0891b2" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="#f1f3f5" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                stroke="transparent"
                tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Poppins, sans-serif' }}
                tickLine={false}
                axisLine={false}
                interval={getTickInterval()}
                minTickGap={20}
              />
              <YAxis
                stroke="transparent"
                tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Poppins, sans-serif' }}
                tickLine={false}
                axisLine={false}
                domain={yDomain}
                width={44}
                tickMargin={4}
              />
              {stats && stats.average != null && (
                <ReferenceLine
                  y={stats.average}
                  stroke="#0891b2"
                  strokeDasharray="5 3"
                  strokeOpacity={0.35}
                  label={{ value: `avg ${stats.average}`, fill: '#0891b299', fontSize: 10, position: 'insideTopRight' }}
                />
              )}
              {gapKeys.map(gapKey => (
                <Line
                  key={`${question.question_id}-${gapKey}`}
                  type="monotone"
                  dataKey={gapKey}
                  stroke="#0891b2"
                  strokeWidth={2.5}
                  strokeDasharray="1 5"
                  strokeLinecap="round"
                  dot={false}
                  activeDot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: '#0891b230', strokeWidth: 1 }}
                animationDuration={0}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#0891b2"
                strokeWidth={2.5}
                fill={`url(#grad-n-${question.question_id})`}
                dot={false}
                activeDot={{ r: 5, fill: '#0891b2', stroke: '#fff', strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={true}
                animationDuration={900}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // ── CHOICE CHART ─────────────────────────────────────────────────────────────
  const renderChoiceChart = (question) => {
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 11, 31));

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

    const heatmapData = Object.values(responseMap).map(item => ({
      date: item.date,
      count: 1,
      choice: item.choice,
      color: item.color
    }));

    // Horizontal bar distribution
    const distItems = question.distribution
      ? Object.entries(question.distribution)
          .filter(([_, d]) => d.count > 0)
          .sort(([_, a], [__, b]) => b.count - a.count)
      : [];
    const maxCount = distItems.length > 0 ? Math.max(...distItems.map(([_, d]) => d.count)) : 1;

    return (
      <div key={question.question_id} className="chart-card">
        <div className="chart-header">
          <div className="chart-title-section">
            <div className="chart-icon-wrap chart-icon-wrap--choice">
              <CalendarIcon size={17} />
            </div>
            <div>
              <h3 className="chart-title">{question.question_text}</h3>
              <p className="chart-category">{question.category || 'General'}</p>
            </div>
          </div>
          {question.line_chart.total_responses > 0 && (
            <div className="chart-header-right">
              <div className="stat-pill stat-pill--violet">
                <span className="stat-pill-label">Entries</span>
                <span className="stat-pill-value">{question.line_chart.total_responses}</span>
              </div>
            </div>
          )}
        </div>

        {/* Year Selector */}
        <div className="year-selector">
          <button className="year-nav-button" onClick={() => setSelectedYear(selectedYear - 1)} aria-label="Previous year">
            <ChevronLeft size={16} />
          </button>
          <span className="year-display">{selectedYear}</span>
          <button
            className="year-nav-button"
            onClick={() => setSelectedYear(selectedYear + 1)}
            disabled={selectedYear >= new Date().getFullYear()}
            aria-label="Next year"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Calendar Heatmap */}
        <div className="heatmap-container">
          <CalendarHeatmap
            startDate={yearStart}
            endDate={yearEnd}
            values={heatmapData}
            gutterSize={3}
            classForValue={(value) => (!value || !value.count ? 'color-empty' : 'color-filled')}
            tooltipDataAttrs={(value) => {
              if (!value || !value.date) return {};
              return {
                'data-tooltip-id': 'heatmap-tooltip',
                'data-tooltip-content': `${format(new Date(value.date), 'MMM dd, yyyy')}: ${value.choice || 'No response'}`
              };
            }}
            transformDayElement={(element, value) => {
              if (value && value.color) {
                return React.cloneElement(element, {
                  style: { ...element.props.style, fill: value.color, opacity: 1 }
                });
              }
              return element;
            }}
          />
          <ReactTooltip
            id="heatmap-tooltip"
            className="custom-tooltip"
            style={{
              backgroundColor: 'white',
              color: '#2c3e50',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '0.5rem 0.75rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              opacity: 1
            }}
            render={({ content }) => {
              if (!content) return null;
              const [date, choice] = content.split(': ');
              return (
                <div>
                  <p className="tooltip-date">{date}</p>
                  <p className="tooltip-value">{choice}</p>
                </div>
              );
            }}
          />
        </div>

        {/* Horizontal bar distribution */}
        {distItems.length > 0 && (
          <div className="distribution-section">
            <h4 className="distribution-title">Choice Distribution</h4>
            <div className="dist-h-bars">
              {distItems.map(([choice, data]) => (
                <div key={choice} className="dist-h-row">
                  <span className="dist-h-label" title={choice}>{choice}</span>
                  <div className="dist-h-bar-wrap">
                    <div
                      className="dist-h-bar-fill"
                      style={{
                        width: `${(data.count / maxCount) * 100}%`,
                        backgroundColor: data.color || '#6366f1'
                      }}
                    />
                  </div>
                  <span className="dist-h-pct">{data.percentage}%</span>
                  <span className="dist-h-count">({data.count})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Group questions by category
  const groupQuestions = (questions) => {
    const grouped = {};
    questions.forEach(question => {
      const category = question.category || 'General';
      const questionType = question.question_type;
      if (!grouped[category]) {
        grouped[category] = { range: [], choice: [], text: [], number: [] };
      }
      if (['range', 'choice', 'number'].includes(questionType)) {
        grouped[category][questionType].push(question);
      }
    });
    return grouped;
  };

  // Completion rate
  const completionRate = useMemo(() => {
    if (!dashboardData) return null;
    const { total_reflections, days_analyzed } = dashboardData.overview;
    return Math.round((total_reflections / days_analyzed) * 100);
  }, [dashboardData]);

  // ── LOADING ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <Navigation />
        <div className="dashboard">
          <div className="dashboard-loading">
            <div className="loading-spinner-modern">
              <div className="spinner-ring" />
            </div>
            <p>Loading your insights...</p>
          </div>
        </div>
      </>
    );
  }

  // ── ERROR ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <>
        <Navigation />
        <div className="dashboard">
          <div className="dashboard-error">
            <p>{error}</p>
            <button onClick={fetchDashboardData} className="retry-button">Retry</button>
          </div>
        </div>
      </>
    );
  }

  // ── EMPTY ────────────────────────────────────────────────────────────────────
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

  // ── RENDER ───────────────────────────────────────────────────────────────────
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
                Visualizing <strong>{dashboardData.overview.total_reflections}</strong> reflections
                from the last <strong>{dashboardData.overview.days_analyzed}</strong> days
              </p>
            </div>
            <div className="day-selector">
              {[7, 30, 90, 365].map(d => (
                <button
                  key={d}
                  className={`day-button ${selectedDays === d ? 'active' : ''}`}
                  onClick={() => setSelectedDays(d)}
                >
                  {d === 365 ? '1 Year' : `${d}d`}
                </button>
              ))}
            </div>
          </div>

          {/* Overview Stats */}
          <div className="overview-stats">
            <div className="stat-card stat-card--blue">
              <div className="stat-icon stat-icon--blue">
                <BookOpen size={21} strokeWidth={2} />
              </div>
              <div className="stat-info">
                <p className="stat-label">Total Reflections</p>
                <p className="stat-number">{dashboardData.overview.total_reflections}</p>
              </div>
              <BookOpen size={72} strokeWidth={0.8} className="stat-card-bg-icon" />
            </div>

            <div className="stat-card stat-card--orange">
              <div className="stat-icon stat-icon--orange">
                <Flame size={21} strokeWidth={2} />
              </div>
              <div className="stat-info">
                <p className="stat-label">Day Streak</p>
                <p className="stat-number">
                  {dashboardData.overview.current_streak}
                  <span className="stat-number-unit"> days</span>
                </p>
              </div>
              <Flame size={72} strokeWidth={0.8} className="stat-card-bg-icon" />
            </div>

            <div className="stat-card stat-card--violet">
              <div className="stat-icon stat-icon--violet">
                <Activity size={21} strokeWidth={2} />
              </div>
              <div className="stat-info">
                <p className="stat-label">Active Questions</p>
                <p className="stat-number">{dashboardData.questions.length}</p>
              </div>
              <Activity size={72} strokeWidth={0.8} className="stat-card-bg-icon" />
            </div>

            <div className="stat-card stat-card--green">
              <div className="stat-icon stat-icon--green">
                <Target size={21} strokeWidth={2} />
              </div>
              <div className="stat-info">
                <p className="stat-label">Completion Rate</p>
                <p className="stat-number">
                  {Math.min(completionRate, 100)}
                  <span className="stat-number-unit">%</span>
                </p>
              </div>
              <div
                className="stat-completion-bar"
                style={{ '--fill': `${Math.min(completionRate, 100)}%` }}
              />
              <Target size={72} strokeWidth={0.8} className="stat-card-bg-icon" />
            </div>
          </div>

          {/* Charts grouped by category */}
          {Object.entries(groupedQuestions).map(([category, questions], categoryIndex, arr) => {
            const charts = [
              ...questions.range.map(q => ({ id: q.question_id, node: renderRangeChart(q) })),
              ...questions.choice.map(q => ({ id: q.question_id, node: renderChoiceChart(q) })),
              ...questions.number.map(q => ({ id: q.question_id, node: renderNumberChart(q) })),
            ];
            if (charts.length === 0) return null;

            return (
              <React.Fragment key={category}>
                <div className="category-section">
                  <div className="category-title-row">
                    <h2 className="category-title">{category}</h2>
                    <span className="category-count">
                      {charts.length} metric{charts.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="charts-grid">
                    {charts.map(chart => (
                      <React.Fragment key={chart.id}>{chart.node}</React.Fragment>
                    ))}
                  </div>
                </div>
                {categoryIndex < arr.length - 1 && (
                  <div className="dashboard-category-divider" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
