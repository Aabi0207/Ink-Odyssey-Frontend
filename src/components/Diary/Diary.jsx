import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PenLine, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  FileText, 
  Image, 
  Video, 
  ChevronUp, 
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X, 
  Save, 
  Calendar,
  BookOpen
} from 'lucide-react';
import './Diary.css';
import Navigation from '../Navigation/Navigation';

const API_BASE_URL = 'https://aabidon.pythonanywhere.com/api/diary';
const BACKEND_URL = 'https://aabidon.pythonanywhere.com';

// Helper function to get full media URL
const getMediaUrl = (url) => {
  if (!url) return null;
  // If it's already a full URL (starts with http or data:), return as is
  if (url.startsWith('http') || url.startsWith('data:')) {
    return url;
  }
  // If it's a relative path, prepend the backend URL
  return `${BACKEND_URL}${url.startsWith('/') ? url : `/${url}`}`;
};

const Diary = () => {
  const { accessToken, logout } = useAuth();
  const { date } = useParams();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState({ text: 'Loading inspiration...', author: '' });
  const [selectedDate, setSelectedDate] = useState(date || new Date().toISOString().split('T')[0]);
  const [view, setView] = useState('list'); // 'list', 'detail', 'create', 'edit'
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date());
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content_blocks: []
  });

  // Fetch all entries
  const fetchEntries = async (date = null) => {
    try {
      setLoading(true);
      const url = date 
        ? `${API_BASE_URL}/entries/by-date/?date=${date}`
        : `${API_BASE_URL}/entries/`;
      
      console.log('Fetching entries from:', url);
      console.log('Access token present:', !!accessToken);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        const entriesData = data.results || data;
        console.log('Fetched entries:', entriesData);
        setEntries(entriesData);
      } else if (response.status === 401) {
        console.error('Unauthorized - redirecting to login');
        logout();
      } else {
        const errorText = await response.text();
        console.error('Error fetching entries. Status:', response.status, 'Response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch quote from ZenQuotes
  const fetchQuote = async () => {
    try {
      // Use CORS proxy to avoid CORS issues
      const response = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://zenquotes.io/api/today'));
      if (!response.ok) {
        throw new Error('Failed to fetch quote');
      }
      const proxyData = await response.json();
      const data = JSON.parse(proxyData.contents);
      
      if (data && data[0]) {
        setQuote({
          text: data[0].q,
          author: data[0].a
        });
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      setQuote({
        text: 'Every day is a new page in your story.',
        author: 'Unknown'
      });
    }
  };

  // Fetch entry by ID
  const fetchEntryById = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/entries/${id}/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedEntry(data);
        setView('detail');
      }
    } catch (error) {
      console.error('Error fetching entry:', error);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Stats fetched but not displayed in UI anymore
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Create new entry
  const createEntry = async (e) => {
    e.preventDefault();
    
    if (!accessToken) {
      console.error('No access token available');
      logout();
      return;
    }
    
    // ✅ LOG THE DATA BEING SENT
    console.log('Sending formData:', JSON.stringify(formData, null, 2));
    
    try {
      const response = await fetch(`${API_BASE_URL}/entries/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const data = await response.json();
        // Refetch entries to get full content
        await fetchEntries(selectedDate);
        resetForm();
        setView('list');
        fetchStats();
      } else if (response.status === 401) {
        console.error('Unauthorized - token may be expired');
        logout();
      } else {
        const errorData = await response.json();
        // ✅ NOW YOU'LL SEE DETAILED ERRORS
        console.error('Error creating entry. Status:', response.status);
        console.error('Error details:', errorData);
        alert(`Error creating entry: ${JSON.stringify(errorData.details || errorData, null, 2)}`);
      }
    } catch (error) {
      console.error('Error creating entry:', error);
    }
  };

  // Update entry
  const updateEntry = async (e) => {
    e.preventDefault();
    
    if (!accessToken) {
      console.error('No access token available');
      logout();
      return;
    }
    
    // ✅ LOG THE DATA BEING SENT
    console.log('Updating entry with formData:', JSON.stringify(formData, null, 2));
    
    try {
      const response = await fetch(`${API_BASE_URL}/entries/${selectedEntry.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const data = await response.json();
        // Refetch entries to get updated content
        await fetchEntries(selectedDate);
        setSelectedEntry(null);
        setIsEditing(false);
        setView('list');
      } else if (response.status === 401) {
        console.error('Unauthorized - token may be expired');
        logout();
      } else {
        const errorData = await response.json();
        console.error('Error updating entry. Status:', response.status);
        console.error('Error details:', errorData);
        alert(`Error updating entry: ${JSON.stringify(errorData.details || errorData, null, 2)}`);
      }
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  // Delete entry
  const deleteEntry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/entries/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        setEntries(entries.filter(entry => entry.id !== id));
        setSelectedEntry(null);
        setView('list');
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  // Fetch entries by date
  const fetchEntriesByDate = async (date) => {
    fetchEntries(date);
  };

  // Handle date change
  const handleDateChange = (newDate) => {
    navigate(`/diary/${newDate}`);
    setShowDatePicker(false);
  };

  // Toggle date picker
  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
    if (!showDatePicker) {
      // Set picker to current selected date's month
      const currentDate = new Date(selectedDate);
      setPickerMonth(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    }
  };

  // Calendar picker functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const previousMonth = () => {
    setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1));
  };

  // Helper to format date to YYYY-MM-DD without timezone issues
  const formatDateString = (year, month, day) => {
    const y = year.toString();
    const m = (month + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isSelectedDate = (day) => {
    const year = pickerMonth.getFullYear();
    const month = pickerMonth.getMonth();
    const dateString = formatDateString(year, month, day);
    return dateString === selectedDate;
  };

  const isToday = (day) => {
    const today = new Date();
    const year = pickerMonth.getFullYear();
    const month = pickerMonth.getMonth();
    
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const handleDayClick = (day) => {
    const year = pickerMonth.getFullYear();
    const month = pickerMonth.getMonth();
    const dateString = formatDateString(year, month, day);
    handleDateChange(dateString);
  };

  // Format date for display
  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Add content block
  const addContentBlock = (type) => {
    const newBlock = {
      block_type: type,
      order: formData.content_blocks.length,
      text_content: type === 'text' ? '' : null,
      media_url: type !== 'text' ? '' : null,
      file_data: type !== 'text' ? '' : null,
      caption: ''
    };
    setFormData({
      ...formData,
      content_blocks: [...formData.content_blocks, newBlock]
    });
  };

  // Update content block
  const updateContentBlock = (index, field, value) => {
    const updatedBlocks = [...formData.content_blocks];
    updatedBlocks[index][field] = value;
    setFormData({
      ...formData,
      content_blocks: updatedBlocks
    });
  };

  // Handle file upload for image/video
  const handleFileUpload = (index, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      // Store the base64 data in file_data field for backend processing
      const updatedBlocks = [...formData.content_blocks];
      updatedBlocks[index]['file_data'] = reader.result;
      updatedBlocks[index]['media_url'] = reader.result; // Keep for preview
      setFormData({
        ...formData,
        content_blocks: updatedBlocks
      });
    };
    reader.readAsDataURL(file);
  };

  // Remove content block
  const removeContentBlock = (index) => {
    const updatedBlocks = formData.content_blocks.filter((_, i) => i !== index);
    // Reorder remaining blocks
    updatedBlocks.forEach((block, i) => {
      block.order = i;
    });
    setFormData({
      ...formData,
      content_blocks: updatedBlocks
    });
  };

  // Move content block
  const moveContentBlock = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.content_blocks.length) return;
    
    const updatedBlocks = [...formData.content_blocks];
    [updatedBlocks[index], updatedBlocks[newIndex]] = [updatedBlocks[newIndex], updatedBlocks[index]];
    
    // Update order values
    updatedBlocks.forEach((block, i) => {
      block.order = i;
    });
    
    setFormData({
      ...formData,
      content_blocks: updatedBlocks
    });
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      content_blocks: []
    });
    setIsCreating(false);
    setIsEditing(false);
    setSelectedEntry(null);
  };

  // Start editing
  const startEditing = (entry) => {
    setFormData({
      title: entry.title,
      content_blocks: entry.content_blocks.map(block => ({
        block_type: block.block_type,
        order: block.order,
        text_content: block.text_content || '',
        media_url: block.media_url || '',
        file_data: '', // New files will be added here
        caption: block.caption || ''
      }))
    });
    setSelectedEntry(entry);
    setIsEditing(true);
    setView('edit');
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (!accessToken) {
      console.error('No access token - redirecting to login');
      logout();
      return;
    }
    
    if (date) {
      setSelectedDate(date);
      fetchEntriesByDate(date);
    } else {
      // If no date in URL, redirect to today's date
      const today = new Date().toISOString().split('T')[0];
      navigate(`/diary/${today}`, { replace: true });
      return;
    }
    
    fetchQuote();
    fetchStats();
  }, [accessToken, date]);

  if (loading && entries.length === 0) {
    return (
      <div className="diary-container">
        <div className="loading">Loading your diary...</div>
      </div>
    );
  }

  return (
    <div className="diary-container">
      {/* Navigation */}
      <Navigation />

      {/* Diary Header with Logo, Quote, and Date */}
      <header className="diary-page-header">
        <div className="diary-header-content">
          {/* Logo and Quote Section */}
          <div className="diary-logo-quote-section">
            <div className="diary-logo-section">
              <img src="/logo.png" alt="InkOdyssey" className="diary-logo" />
            </div>
            
            {/* Quote below logo */}
            <div className="diary-quote-section">
              <blockquote className="daily-quote">
                <p className="quote-text">"{quote.text}"</p>
                <cite className="quote-author">— {quote.author}</cite>
              </blockquote>
            </div>
          </div>

          {/* Right: Date with Calendar */}
          <div className="diary-date-section">
            <div className="date-display" onClick={toggleDatePicker}>
              <span className="current-date">{formatDisplayDate(selectedDate)}</span>
              <div className="calendar-icon-label" title="Choose date">
                <Calendar size={20} className="calendar-icon" />
              </div>
            </div>

            {/* Custom Date Picker */}
            {showDatePicker && (
              <div className="custom-date-picker">
                <div className="picker-header">
                  <button onClick={(e) => { e.stopPropagation(); previousMonth(); }} className="picker-nav-btn">
                    <ChevronLeft size={18} />
                  </button>
                  <span className="picker-month">
                    {pickerMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); nextMonth(); }} className="picker-nav-btn">
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="picker-grid">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="picker-weekday">{day}</div>
                  ))}
                  
                  {(() => {
                    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(pickerMonth);
                    const days = [];
                    
                    // Empty cells before month starts
                    for (let i = 0; i < startingDayOfWeek; i++) {
                      days.push(<div key={`empty-${i}`} className="picker-day empty"></div>);
                    }
                    
                    // Days of the month
                    for (let day = 1; day <= daysInMonth; day++) {
                      days.push(
                        <div
                          key={day}
                          className={`picker-day ${isToday(day) ? 'today' : ''} ${isSelectedDate(day) ? 'selected' : ''}`}
                          onClick={(e) => { e.stopPropagation(); handleDayClick(day); }}
                        >
                          {day}
                        </div>
                      );
                    }
                    
                    return days;
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Overlay to close date picker */}
      {showDatePicker && (
        <div className="date-picker-overlay" onClick={() => setShowDatePicker(false)}></div>
      )}

      {/* Main Content */}
      <div className="diary-main">
        {/* List View */}
        {view === 'list' && (
          <>
            <div className="diary-actions">
              <button 
                onClick={() => {
                  resetForm();
                  setView('create');
                }} 
                className="btn btn-primary btn-new-memory"
              >
                <PenLine size={18} style={{ marginRight: '8px' }} />
                New Memory
              </button>
            </div>

            <div className="entries-list">
              {entries.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <BookOpen size={48} />
                  </div>
                  <h3>No memories for this day</h3>
                  <p>Start capturing your thoughts and moments!</p>
                  <button 
                    onClick={() => {
                      resetForm();
                      setView('create');
                    }} 
                    className="btn btn-primary"
                  >
                    Create Memory
                  </button>
                </div>
              ) : (
                entries.map(entry => (
                  <div 
                    key={entry.id} 
                    className="entry-card"
                  >
                    <div className="entry-header">
                      <h3>{entry.title}</h3>
                      <div className="entry-actions-inline">
                        <button 
                          onClick={() => startEditing(entry)} 
                          className="btn btn-primary btn-sm"
                        >
                          <Edit size={16} style={{ marginRight: '6px' }} />
                          Edit
                        </button>
                        <button 
                          onClick={() => deleteEntry(entry.id)} 
                          className="btn btn-danger btn-sm"
                        >
                          <Trash2 size={16} style={{ marginRight: '6px' }} />
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="entry-metadata">
                      <span className="entry-date">{formatDate(entry.created_at)}</span>
                    </div>
                    
                    {/* Display content blocks */}
                    <div className="content-blocks">
                      {entry.content_blocks && entry.content_blocks.length > 0 ? (
                        entry.content_blocks.map((block, index) => (
                          <div key={index} className={`content-block block-${block.block_type}`}>
                            {block.block_type === 'text' && (
                              <p className="block-text">{block.text_content}</p>
                            )}
                            {block.block_type === 'image' && (
                              <div className="block-media">
                                {block.media_url && (
                                  <img 
                                    src={getMediaUrl(block.media_url)} 
                                    alt={block.caption || 'Image'} 
                                    onError={(e) => {
                                      console.error('Image failed to load:', block.media_url);
                                      console.error('Full URL:', getMediaUrl(block.media_url));
                                      e.target.style.display = 'none';
                                    }}
                                    onLoad={() => console.log('Image loaded successfully:', getMediaUrl(block.media_url))}
                                  />
                                )}
                                {block.caption && <p className="block-caption">{block.caption}</p>}
                              </div>
                            )}
                            {block.block_type === 'video' && (
                              <div className="block-media">
                                {block.media_url && (
                                  <video controls>
                                    <source src={getMediaUrl(block.media_url)} />
                                    Your browser does not support the video tag.
                                  </video>
                                )}
                                {block.caption && <p className="block-caption">{block.caption}</p>}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="no-content">No content</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Detail View */}
        {view === 'detail' && selectedEntry && (
          <div className="entry-detail">
            <button 
              onClick={() => setView('list')} 
              className="btn btn-secondary btn-back"
            >
              <ArrowLeft size={18} style={{ marginRight: '6px' }} />
              Back
            </button>
            
            <div className="entry-detail-header">
              <h2>{selectedEntry.title}</h2>
              <div className="entry-actions">
                <button 
                  onClick={() => startEditing(selectedEntry)} 
                  className="btn btn-primary"
                >
                  <Edit size={18} style={{ marginRight: '8px' }} />
                  Edit
                </button>
                <button 
                  onClick={() => deleteEntry(selectedEntry.id)} 
                  className="btn btn-danger"
                >
                  <Trash2 size={18} style={{ marginRight: '8px' }} />
                  Delete
                </button>
              </div>
            </div>
            
            <div className="entry-metadata">
              <span>Created: {formatDate(selectedEntry.created_at)}</span>
              {selectedEntry.updated_at !== selectedEntry.created_at && (
                <span>Updated: {formatDate(selectedEntry.updated_at)}</span>
              )}
            </div>

            <div className="content-blocks">
              {selectedEntry.content_blocks && selectedEntry.content_blocks.length > 0 ? (
                selectedEntry.content_blocks.map((block, index) => (
                  <div key={index} className={`content-block block-${block.block_type}`}>
                    {block.block_type === 'text' && (
                      <p className="block-text">{block.text_content}</p>
                    )}
                    {block.block_type === 'image' && (
                      <div className="block-media">
                        {block.media_url && (
                          <img src={getMediaUrl(block.media_url)} alt={block.caption || 'Image'} />
                        )}
                        {block.caption && <p className="block-caption">{block.caption}</p>}
                      </div>
                    )}
                    {block.block_type === 'video' && (
                      <div className="block-media">
                        {block.media_url && (
                          <video controls>
                            <source src={getMediaUrl(block.media_url)} />
                            Your browser does not support the video tag.
                          </video>
                        )}
                        {block.caption && <p className="block-caption">{block.caption}</p>}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="no-content">No content blocks</p>
              )}
            </div>
          </div>
        )}

        {/* Create/Edit Form */}
        {(view === 'create' || view === 'edit') && (
          <div className="entry-form">
            <button 
              onClick={() => {
                resetForm();
                setView('list');
              }} 
              className="btn btn-secondary btn-back"
            >
              <ArrowLeft size={18} style={{ marginRight: '6px' }} />
              Cancel
            </button>

            <h2>{view === 'create' ? 'Create New Memory' : 'Edit Memory'}</h2>

            <form onSubmit={view === 'create' ? createEntry : updateEntry}>
              <div className="form-group">
                <label htmlFor="title">Memory Title</label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Give your entry a title..."
                  required
                  className="form-control"
                />
              </div>

              <div className="content-blocks-section">
                <div className="section-header">
                  <h3>Content Blocks</h3>
                  <div className="block-buttons">
                    <button 
                      type="button" 
                      onClick={() => addContentBlock('text')}
                      className="btn btn-sm btn-outline"
                    >
                      <FileText size={16} style={{ marginRight: '6px' }} />
                      Text
                    </button>
                    <button 
                      type="button" 
                      onClick={() => addContentBlock('image')}
                      className="btn btn-sm btn-outline"
                    >
                      <Image size={16} style={{ marginRight: '6px' }} />
                      Image
                    </button>
                    <button 
                      type="button" 
                      onClick={() => addContentBlock('video')}
                      className="btn btn-sm btn-outline"
                    >
                      <Video size={16} style={{ marginRight: '6px' }} />
                      Video
                    </button>
                  </div>
                </div>

                {formData.content_blocks.length === 0 ? (
                  <p className="no-blocks-message">
                    Add content blocks to your entry using the buttons above.
                  </p>
                ) : (
                  <div className="blocks-editor">
                    {formData.content_blocks.map((block, index) => (
                      <div key={index} className="block-editor">
                        <div className="block-editor-header">
                          <span className="block-type-badge">{block.block_type}</span>
                          <div className="block-controls">
                            <button
                              type="button"
                              onClick={() => moveContentBlock(index, 'up')}
                              disabled={index === 0}
                              className="btn btn-icon"
                              title="Move up"
                            >
                              <ChevronUp size={16} color="currentColor" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveContentBlock(index, 'down')}
                              disabled={index === formData.content_blocks.length - 1}
                              className="btn btn-icon"
                              title="Move down"
                            >
                              <ChevronDown size={16} color="currentColor" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeContentBlock(index)}
                              className="btn btn-icon btn-remove"
                              title="Remove block"
                            >
                              <X size={16} color="currentColor" />
                            </button>
                          </div>
                        </div>

                        {block.block_type === 'text' && (
                          <textarea
                            value={block.text_content}
                            onChange={(e) => updateContentBlock(index, 'text_content', e.target.value)}
                            placeholder="Write your thoughts here..."
                            rows="4"
                            className="form-control"
                            required
                          />
                        )}

                        {(block.block_type === 'image' || block.block_type === 'video') && (
                          <>
                            <div className="file-upload-container">
                              <input
                                type="file"
                                accept={block.block_type === 'image' ? 'image/*' : 'video/*'}
                                onChange={(e) => handleFileUpload(index, e.target.files[0])}
                                className="file-input"
                                id={`file-${index}`}
                              />
                              <label htmlFor={`file-${index}`} className="file-label">
                                {block.media_url ? 'Change File' : `Choose ${block.block_type}`}
                              </label>
                              {block.media_url && (
                                <span className="file-name">File uploaded ✓</span>
                              )}
                            </div>
                            
                            {/* Preview */}
                            {block.media_url && (
                              <div className="media-preview">
                                {block.block_type === 'image' ? (
                                  <img src={block.media_url} alt="Preview" className="preview-image" />
                                ) : (
                                  <video src={block.media_url} controls className="preview-video" />
                                )}
                              </div>
                            )}
                            
                            <input
                              type="text"
                              value={block.caption}
                              onChange={(e) => updateContentBlock(index, 'caption', e.target.value)}
                              placeholder="Add a caption (optional)..."
                              className="form-control"
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-lg">
                  {view === 'create' ? (
                    <>
                      <PenLine size={18} style={{ marginRight: '8px' }} />
                      Save Memory
                    </>
                  ) : (
                    <>
                      <Save size={18} style={{ marginRight: '8px' }} />
                      Update Memory
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    resetForm();
                    setView('list');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Diary;
