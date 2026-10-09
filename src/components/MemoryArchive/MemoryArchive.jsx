import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navigation from '../Navigation/Navigation';
import './MemoryArchive.css';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Tag as TagIcon, Clock, ChevronDown } from 'lucide-react';

const API_BASE_URL = 'https://aabidon.pythonanywhere.com/api/memory-archive';
const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

// Helper function to render formatted text (bold and italic)
const renderFormattedText = (text) => {
  if (!text) return '';
  const parts = [];
  let currentIndex = 0;
  const textStr = String(text);
  const regex = /(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
  let match;
  
  while ((match = regex.exec(textStr)) !== null) {
    if (match.index > currentIndex) {
      parts.push(textStr.substring(currentIndex, match.index));
    }
    if (match[0].startsWith('**') && match[0].endsWith('**')) {
      const content = match[0].slice(2, -2);
      parts.push(<strong key={match.index}>{content}</strong>);
    } else if (match[0].startsWith('*') && match[0].endsWith('*')) {
      const content = match[0].slice(1, -1);
      parts.push(<em key={match.index}>{content}</em>);
    }
    currentIndex = match.index + match[0].length;
  }
  
  if (currentIndex < textStr.length) {
    parts.push(textStr.substring(currentIndex));
  }
  
  return parts.length > 0 ? parts : text;
};

const MemoryArchive = () => {
  const { accessToken } = useAuth();
  
  const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://127.0.0.1:8000${url}`;
  };

  const [backgroundImage, setBackgroundImage] = useState('');
  const categories = ['vintage', 'monochrome', 'journal', 'memories', 'photography', 'writing', 'diary'];
  const categoryIndexRef = useRef(0);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tagSummary, setTagSummary] = useState({ tag_counts: [], date_tags: {} });
  
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [order, setOrder] = useState('-created_at');
  
  const [memories, setMemories] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef(null);
  const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(false);
  const orderDropdownRef = useRef(null);

  const fetchBackgroundImage = useCallback(async () => {
    try {
      const category = categories[categoryIndexRef.current];
      categoryIndexRef.current = (categoryIndexRef.current + 1) % categories.length;
      const response = await fetch(`https://api.unsplash.com/photos/random?query=${category}&client_id=${UNSPLASH_ACCESS_KEY}`);
      if (response.ok) {
        const data = await response.json();
        setBackgroundImage(data.urls.full);
      }
    } catch (error) {
      console.error('Error fetching background image:', error);
    }
  }, []);

  useEffect(() => {
    fetchBackgroundImage();
  }, [fetchBackgroundImage]);

  // Handle clicking outside filter dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target)) {
        setIsTagDropdownOpen(false);
      }
      if (orderDropdownRef.current && !orderDropdownRef.current.contains(event.target)) {
        setIsOrderDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch tag summary for the current month
  const fetchTagSummary = useCallback(async () => {
    if (!accessToken) return;
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1; // 1-12
      const res = await fetch(`${API_BASE_URL}/tags-summary/?year=${year}&month=${month}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTagSummary(data);
      }
    } catch (err) {
      console.error('Failed to fetch tag summary', err);
    }
  }, [currentMonth, accessToken]);

  useEffect(() => {
    fetchTagSummary();
  }, [fetchTagSummary]);

  // Fetch memories based on filters
  const fetchMemories = useCallback(async (pageNum) => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const pageSize = window.innerWidth < 768 ? 1 : 3;
      let url = `${API_BASE_URL}/memories/?page=${pageNum}&order=${order}&page_size=${pageSize}`;
      if (selectedTags.length > 0) url += `&tag=${encodeURIComponent(selectedTags.join(','))}`;
      if (selectedDate) url += `&date=${selectedDate}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setMemories(data.results);
        setHasMore(data.next !== null);
      } else {
        setMemories([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to fetch memories', err);
      setMemories([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [selectedTags, selectedDate, order, accessToken]);

  // Whenever filters change, reset to page 1
  useEffect(() => {
    setPage(1);
    fetchMemories(1);
  }, [selectedTags, selectedDate, order, fetchMemories]);

  const handleNextPage = () => {
    if (hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMemories(nextPage);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      const prevPage = page - 1;
      setPage(prevPage);
      fetchMemories(prevPage);
    }
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    setSelectedTags([]); // Clear tag selection when picking a date, or maybe keep them? The user said filter by tags OR specific date. Let's clear it.
  };

  const handleTagToggle = (tagName) => {
    setSelectedTags(prev => {
      if (prev.includes(tagName)) {
        return prev.filter(t => t !== tagName);
      } else {
        return [...prev, tagName];
      }
    });
    setSelectedDate(null); // Clear date filter if they are using tag filter
  };

  const clearFilters = () => {
    setSelectedDate(null);
    setSelectedTags([]);
  };

  // Calendar generation
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const today = new Date();
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  // All unique tags available this month for the multiselect
  const availableTags = tagSummary.tag_counts.map(t => t.name);

  return (
    <div className="memory-archive-wrapper">
      <Navigation />
      
      {backgroundImage && (
        <div className="archive-hero-wrapper">
          <div className="archive-hero-image" style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }} />
        </div>
      )}

      <div className="memory-archive-container">
        
        <div className="archive-content">
          {/* LEFT SIDE: Calendar & Tags */}
          <div className="calendar-section">
            <div className="calendar-header">
              <button className="calendar-nav-btn" onClick={prevMonth}><ChevronLeft size={20} /></button>
              <div className="calendar-month">
                {monthNames[month]} {year}
              </div>
              <button className="calendar-nav-btn" onClick={nextMonth}><ChevronRight size={20} /></button>
            </div>
            
            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-day-header">{day}</div>
              ))}
              
              {blanks.map(b => (
                <div key={`blank-${b}`} className="calendar-cell empty"></div>
              ))}
              
              {days.map(d => {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const tags = tagSummary.date_tags[dateStr] || [];
                const isSelected = selectedDate === dateStr;
                
                return (
                  <div 
                    key={d} 
                    className={`calendar-cell ${isToday(d) ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleDateClick(dateStr)}
                  >
                    <div className="calendar-date">{d}</div>
                    <div className="calendar-tags">
                      {tags.slice(0, 5).map((t, i) => (
                        <div key={i} className="calendar-tag-item">
                          <div 
                            className="calendar-tag-dot" 
                            style={{ backgroundColor: t.color }}
                            title={t.name}
                          />
                          <span className="calendar-tag-name">{t.name}</span>
                        </div>
                      ))}
                      {tags.length > 5 && <span style={{fontSize: '9px', color: 'var(--archive-dark)', fontWeight: 600}}>+{tags.length - 5}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="tags-summary-section">
              <h3 className="tags-summary-title"><TagIcon size={16} /> Monthly Tags</h3>
              <div className="tags-summary-list">
                {tagSummary.tag_counts.length === 0 ? (
                  <p style={{color: 'var(--archive-muted)', fontSize: '0.9rem'}}>No tags used this month.</p>
                ) : (
                  tagSummary.tag_counts.map(tag => (
                    <div 
                      key={tag.name} 
                      className={`tag-pill ${selectedTags.includes(tag.name) ? 'selected' : ''}`}
                      onClick={() => handleTagToggle(tag.name)}
                    >
                      <div className="tag-color-dot" style={{ backgroundColor: tag.color }}></div>
                      {tag.name} <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>({tag.count})</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Memories List */}
          <div className="memories-section">
            <div className="filter-header">
              <div className="active-filter">
                {selectedDate ? (
                  <><CalendarIcon size={18} /> Memories on {selectedDate}</>
                ) : selectedTags.length > 0 ? (
                  <><TagIcon size={18} /> {selectedTags.length} Tag(s) Selected</>
                ) : (
                  <><Clock size={18} /> All Memories</>
                )}
                
                {(selectedDate || selectedTags.length > 0) && (
                  <button className="clear-filter-btn" onClick={clearFilters}>
                    <X size={14} /> Clear
                  </button>
                )}
              </div>
              
              <div className="filter-controls" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                {/* Custom Multi-Select Dropdown for Tags */}
                <div className="multi-select-container" ref={tagDropdownRef}>
                  <div 
                    className="order-select" 
                    onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                    style={{display: 'flex', alignItems: 'center', gap: '8px', minWidth: '130px', justifyContent: 'space-between'}}
                  >
                    <span>{selectedTags.length > 0 ? `${selectedTags.length} Tags` : 'Filter Tags'}</span>
                    <ChevronDown size={14} />
                  </div>
                  
                  {isTagDropdownOpen && (
                    <div className="multi-select-dropdown">
                      {availableTags.length === 0 ? (
                        <div className="multi-select-option" style={{color: 'var(--archive-muted)'}}>No tags found</div>
                      ) : (
                        availableTags.map(tag => (
                          <div 
                            key={tag} 
                            className="multi-select-option"
                            onClick={() => handleTagToggle(tag)}
                          >
                            <input 
                              type="checkbox" 
                              checked={selectedTags.includes(tag)}
                              readOnly
                            />
                            <span>{tag}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="sort-dropdown-container" ref={orderDropdownRef}>
                  <button
                    type="button"
                    className="order-select sort-dropdown-trigger"
                    aria-haspopup="listbox"
                    aria-expanded={isOrderDropdownOpen}
                    onClick={() => setIsOrderDropdownOpen(!isOrderDropdownOpen)}
                  >
                    <span>{order === '-created_at' ? 'Newest First' : 'Oldest First'}</span>
                    <ChevronDown size={14} />
                  </button>

                  {isOrderDropdownOpen && (
                    <div className="sort-dropdown-menu" role="listbox" aria-label="Sort memories">
                      {[
                        { value: '-created_at', label: 'Newest First' },
                        { value: 'created_at', label: 'Oldest First' }
                      ].map((option) => (
                        <button
                          type="button"
                          role="option"
                          aria-selected={order === option.value}
                          className={`sort-dropdown-option ${order === option.value ? 'selected' : ''}`}
                          key={option.value}
                          onClick={() => {
                            setOrder(option.value);
                            setIsOrderDropdownOpen(false);
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="memories-list">
              {memories.length === 0 && !loading ? (
                <div className="empty-state">
                  No memories found for this filter.
                </div>
              ) : (
                memories.map((memory, index) => (
                  <div key={memory.id} className="memory-card" style={{ animationDelay: `${index * 0.05}s` }}>
                    <div className="memory-header">
                      <div>
                        <h3 className="memory-title">{memory.title}</h3>
                        <div className="memory-date">
                          <CalendarIcon size={14} />
                          {new Date(memory.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="memory-tags">
                      {memory.tags.map(t => (
                        <span key={t.id} className="memory-tag">#{t.name}</span>
                      ))}
                    </div>
                    
                    <div className="content-blocks">
                      {memory.content_blocks && memory.content_blocks.length > 0 ? (
                        memory.content_blocks.map((block, idx) => (
                          <div key={idx} className={`content-block block-${block.block_type}`}>
                            {block.block_type === 'text' && (
                              <p className="block-text">{renderFormattedText(block.text_content)}</p>
                            )}
                            {block.block_type === 'image' && (
                              <div className="block-media">
                                {block.media_url && (
                                  <img 
                                    src={getMediaUrl(block.media_url)} 
                                    alt={block.caption || 'Image'} 
                                    onError={(e) => { e.target.style.display = 'none'; }}
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
                        <p className="block-text">No content.</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Pagination Controls */}
            {(page > 1 || hasMore) && (
              <div className="pagination-controls">
                <button 
                  className="pagination-btn" 
                  onClick={handlePrevPage}
                  disabled={page === 1 || loading}
                >
                  <ChevronLeft size={18} /> Prev
                </button>
                <span className="page-indicator">Page {page}</span>
                <button 
                  className="pagination-btn" 
                  onClick={handleNextPage}
                  disabled={!hasMore || loading}
                >
                  Next <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryArchive;
