import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  ChevronUp, 
  ChevronDown,
  Settings,
  BookOpen
} from 'lucide-react';
import './SelfReflection.css';
import Navigation from '../Navigation/Navigation';

const API_BASE_URL = 'https://aabidon.pythonanywhere.com/api/self-reflection';
const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

const SelfReflection = () => {
  const { accessToken, logout } = useAuth();
  const [view, setView] = useState('reflection'); // 'reflection', 'questions'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Questions state
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  
  // Reflection state
  const [todayReflection, setTodayReflection] = useState(null);
  const [responses, setResponses] = useState({});
  
  // Background image state
  const [backgroundImage, setBackgroundImage] = useState('');
  // Category rotation state
  const categories = [
    'abstract', 'pattern', 'minimal', 'nature', 'history', 'art', 'technology', 'food', 'workspace', 'ocean', 'architecture'
  ];
  const categoryIndexRef = React.useRef(0);
  
  // Dropdown state for custom Material UI-style selects
  const [openDropdowns, setOpenDropdowns] = useState({});
  
  // Question form state
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'range',
    min_value: 1,
    max_value: 10,
    choices: [],
    category: '',
    order: 0,
    is_active: true
  });
  const [choiceInput, setChoiceInput] = useState('');

  useEffect(() => {
    fetchBackgroundImage();
    fetchQuestions();
    fetchTodayReflection();
  }, []);

  // Fetch random landscape image from Unsplash
  const fetchBackgroundImage = async () => {
    try {
      // Rotate category
      const category = categories[categoryIndexRef.current];
      categoryIndexRef.current = (categoryIndexRef.current + 1) % categories.length;
      const response = await fetch(
        `https://api.unsplash.com/photos/random?query=${category}&client_id=${UNSPLASH_ACCESS_KEY}`
      );
      if (response.ok) {
        const data = await response.json();
        setBackgroundImage(data.urls.full);
      }
    } catch (error) {
      console.error('Error fetching background image:', error);
    }
  };

  // Fetch all active questions
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/questions/active/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      } else if (response.status === 401) {
        logout();
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch today's reflection
  const fetchTodayReflection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reflections/today/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTodayReflection(data);
        
        // Pre-fill responses
        const existingResponses = {};
        data.responses.forEach(response => {
          if (response.range_response !== null) {
            existingResponses[response.question_id] = response.range_response;
          } else if (response.choice_response) {
            existingResponses[response.question_id] = response.choice_response;
          } else if (response.text_response) {
            existingResponses[response.question_id] = response.text_response;
          } else if (response.number_response !== null) {
            existingResponses[response.question_id] = response.number_response;
          }
        });
        setResponses(existingResponses);
      }
    } catch (error) {
      console.error('Error fetching today\'s reflection:', error);
    }
  };

  // Handle response change
  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Submit reflection
  const handleSubmitReflection = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const responsesArray = questions.map(question => {
        const response = { question_id: question.id };
        const value = responses[question.id];
        
        if (question.question_type === 'range') {
          response.range_response = value !== undefined ? value : question.min_value;
        } else if (question.question_type === 'choice') {
          if (!value) {
            throw new Error(`Please answer: ${question.question_text}`);
          }
          response.choice_response = value;
        } else if (question.question_type === 'text') {
          response.text_response = value || '';
        } else if (question.question_type === 'number') {
          if (value === undefined || value === '') {
            throw new Error(`Please answer: ${question.question_text}`);
          }
          response.number_response = parseFloat(value);
        }
        
        return response;
      });
      
      const today = new Date().toISOString().split('T')[0];
      const data = {
        date: today,
        responses: responsesArray
      };
      
      const response = await fetch(`${API_BASE_URL}/reflections/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        alert('Reflection saved successfully!');
        await fetchTodayReflection();
      } else {
        const errorData = await response.json();
        alert('Failed to save reflection: ' + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error('Error saving reflection:', error);
      alert(error.message || 'Failed to save reflection');
    } finally {
      setSaving(false);
    }
  };

  // Create/Update Question
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingQuestion 
        ? `${API_BASE_URL}/questions/${editingQuestion.id}/`
        : `${API_BASE_URL}/questions/`;
      
      const method = editingQuestion ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionForm)
      });
      
      if (response.ok) {
        alert(editingQuestion ? 'Question updated!' : 'Question created!');
        setShowQuestionForm(false);
        setEditingQuestion(null);
        resetQuestionForm();
        await fetchQuestions();
      } else {
        const errorData = await response.json();
        alert('Error: ' + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question');
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/questions/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        alert('Question deleted!');
        await fetchQuestions();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question');
    }
  };

  // Edit Question
  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setQuestionForm({
      question_text: question.question_text,
      question_type: question.question_type,
      min_value: question.min_value,
      max_value: question.max_value,
      choices: question.choices || [],
      category: question.category || '',
      order: question.order,
      is_active: question.is_active
    });
    setShowQuestionForm(true);
  };

  // Reset question form
  const resetQuestionForm = () => {
    setQuestionForm({
      question_text: '',
      question_type: 'range',
      min_value: 1,
      max_value: 10,
      choices: [],
      category: '',
      order: 0,
      is_active: true
    });
    setChoiceInput('');
  };

  // Add choice to question
  const handleAddChoice = () => {
    if (choiceInput.trim()) {
      setQuestionForm(prev => ({
        ...prev,
        choices: [...prev.choices, choiceInput.trim()]
      }));
      setChoiceInput('');
    }
  };

  // Remove choice
  const handleRemoveChoice = (index) => {
    setQuestionForm(prev => ({
      ...prev,
      choices: prev.choices.filter((_, i) => i !== index)
    }));
  };

  // Toggle dropdown
  const toggleDropdown = (questionId) => {
    setOpenDropdowns(prev => {
      // Close all other dropdowns and toggle the clicked one
      const allClosed = Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});
      return {
        ...allClosed,
        [questionId]: !prev[questionId]
      };
    });
  };

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setOpenDropdowns({});
  };

  // Close specific dropdown
  const closeDropdown = (questionId) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [questionId]: false
    }));
  };

  // Render question input based on type
  const renderQuestionInput = (question) => {
    const value = responses[question.id];
    const isOpen = openDropdowns[question.id] || false;
    
    if (question.question_type === 'range') {
      // Generate options from min to max
      const options = [];
      for (let i = question.min_value; i <= question.max_value; i++) {
        options.push(i);
      }
      
      return (
        <div className={`mui-select-container ${isOpen ? 'open' : ''}`}>
          <div 
            className={`mui-select ${isOpen ? 'mui-select-open' : ''}`}
            onClick={() => toggleDropdown(question.id)}
          >
            <div className="mui-select-value">
              {value !== undefined ? value : question.min_value}
            </div>
            <ChevronDown className={`mui-select-icon ${isOpen ? 'rotate' : ''}`} size={20} />
          </div>
          {isOpen && (
            <>
              <div className="mui-select-backdrop" onClick={closeAllDropdowns} />
              <div className="mui-select-menu">
                {options.map(opt => (
                  <div
                    key={opt}
                    className={`mui-select-item ${value === opt ? 'selected' : ''}`}
                    onClick={() => {
                      handleResponseChange(question.id, parseInt(opt));
                      closeAllDropdowns();
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      );
    } else if (question.question_type === 'choice') {
      return (
        <div className={`mui-select-container ${isOpen ? 'open' : ''}`}>
          <div 
            className={`mui-select ${isOpen ? 'mui-select-open' : ''}`}
            onClick={() => toggleDropdown(question.id)}
          >
            <div className="mui-select-value">
              {value || 'Select an option'}
            </div>
            <ChevronDown className={`mui-select-icon ${isOpen ? 'rotate' : ''}`} size={20} />
          </div>
          {isOpen && (
            <>
              <div className="mui-select-backdrop" onClick={closeAllDropdowns} />
              <div className="mui-select-menu">
                {question.choices.map((choice) => (
                  <div
                    key={choice}
                    className={`mui-select-item ${value === choice ? 'selected' : ''}`}
                    onClick={() => {
                      handleResponseChange(question.id, choice);
                      closeAllDropdowns();
                    }}
                  >
                    {choice}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      );
    } else if (question.question_type === 'text') {
      return (
        <textarea
          value={value || ''}
          onChange={(e) => handleResponseChange(question.id, e.target.value)}
          className="reflection-text-input"
          rows="4"
          placeholder="Enter your thoughts..."
        />
      );
    } else if (question.question_type === 'number') {
      return (
        <input
          type="number"
          step="any"
          value={value !== undefined ? value : ''}
          onChange={(e) => handleResponseChange(question.id, e.target.value)}
          className="reflection-number-input"
          placeholder="Enter a number..."
        />
      );
    }
  };

  // Group questions by category
  const groupQuestionsByCategory = () => {
    const grouped = {};
    questions.forEach(question => {
      const category = question.category || 'General';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(question);
    });
    return grouped;
  };

  // Render reflection form
  const renderReflectionView = () => {
    const groupedQuestions = groupQuestionsByCategory();
    
    return (
      <div className="reflection-view">
        <div className="reflection-header">
          <div className="reflection-header-content">
            <div className="reflection-header-left">
              <BookOpen size={32} className="reflection-icon" />
              <div>
                <h1 className="reflection-title">Daily Reflection</h1>
                <p className="reflection-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="reflection-loading">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="reflection-empty-state">
            <Settings size={48} />
            <h3>No questions yet</h3>
            <p>Go to the Questions tab to create your first reflection question.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmitReflection} className="reflection-form">
            <div className="reflection-questions-list">
              {Object.entries(groupedQuestions).map(([category, categoryQuestions]) => (
                <div key={category} className="reflection-category-section">
                  <h2 className="reflection-category-title">{category}</h2>
                  {categoryQuestions.map((question) => (
                    <div key={question.id} className="reflection-question-card">
                      {question.question_type === 'text' ? (
                        <>
                          <div className="reflection-question-header">
                            <h3 className="reflection-question-text">{question.question_text}</h3>
                          </div>
                          <div className="reflection-question-body">
                            {renderQuestionInput(question)}
                          </div>
                        </>
                      ) : (
                        <div className="reflection-question-row">
                          <h3 className="reflection-question-text">{question.question_text}</h3>
                          <div className="reflection-question-input">
                            {renderQuestionInput(question)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <button type="submit" className="reflection-submit-btn" disabled={saving}>
              <Save size={20} />
              {saving ? 'Saving...' : todayReflection ? 'Update Reflection' : 'Save Reflection'}
            </button>
          </form>
        )}
      </div>
    );
  };

  // Render questions management
  const renderQuestionsView = () => (
    <div className="reflection-questions-view">
      <div className="reflection-questions-header">
        <h2>Manage Questions</h2>
        <button 
          className="reflection-add-question-btn"
          onClick={() => {
            setShowQuestionForm(true);
            setEditingQuestion(null);
            resetQuestionForm();
          }}
        >
          <Plus size={20} />
          Add Question
        </button>
      </div>

      {showQuestionForm && (
        <div className="reflection-question-form-overlay">
          <div className="reflection-question-form-modal">
            <div className="reflection-question-form-header">
              <h3>{editingQuestion ? 'Edit Question' : 'Create New Question'}</h3>
              <button 
                className="reflection-close-btn"
                onClick={() => {
                  setShowQuestionForm(false);
                  setEditingQuestion(null);
                  resetQuestionForm();
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="reflection-question-form">
              <div className="reflection-form-group">
                <label>Question Text *</label>
                <input
                  type="text"
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm({...questionForm, question_text: e.target.value})}
                  required
                  placeholder="e.g., Rate your day out of 10"
                />
              </div>

              <div className="reflection-form-row">
                <div className="reflection-form-group">
                  <label>Question Type *</label>
                  <select
                    value={questionForm.question_type}
                    onChange={(e) => setQuestionForm({...questionForm, question_type: e.target.value})}
                  >
                    <option value="range">Range (1-10)</option>
                    <option value="choice">Multiple Choice</option>
                    <option value="text">Text Response</option>
                    <option value="number">Number Input</option>
                  </select>
                </div>

                <div className="reflection-form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={questionForm.category}
                    onChange={(e) => setQuestionForm({...questionForm, category: e.target.value})}
                    placeholder="e.g., Wellness, Productivity"
                  />
                </div>
              </div>

              {questionForm.question_type === 'range' && (
                <div className="reflection-form-row">
                  <div className="reflection-form-group">
                    <label>Min Value</label>
                    <input
                      type="number"
                      value={questionForm.min_value}
                      onChange={(e) => setQuestionForm({...questionForm, min_value: parseInt(e.target.value)})}
                      min="0"
                    />
                  </div>
                  <div className="reflection-form-group">
                    <label>Max Value</label>
                    <input
                      type="number"
                      value={questionForm.max_value}
                      onChange={(e) => setQuestionForm({...questionForm, max_value: parseInt(e.target.value)})}
                      max="100"
                    />
                  </div>
                </div>
              )}

              {questionForm.question_type === 'choice' && (
                <div className="reflection-form-group">
                  <label>Choices *</label>
                  <div className="reflection-choices-input">
                    <input
                      type="text"
                      value={choiceInput}
                      onChange={(e) => setChoiceInput(e.target.value)}
                      placeholder="Add a choice..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddChoice();
                        }
                      }}
                    />
                    <button type="button" onClick={handleAddChoice} className="reflection-add-choice-btn">
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="reflection-choices-list">
                    {questionForm.choices.map((choice, index) => (
                      <div key={index} className="reflection-choice-item">
                        <span>{choice}</span>
                        <button type="button" onClick={() => handleRemoveChoice(index)}>
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="reflection-form-row">
                <div className="reflection-form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={questionForm.order}
                    onChange={(e) => setQuestionForm({...questionForm, order: parseInt(e.target.value)})}
                    min="0"
                  />
                </div>
                <div className="reflection-form-group reflection-checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={questionForm.is_active}
                      onChange={(e) => setQuestionForm({...questionForm, is_active: e.target.checked})}
                    />
                    Active
                  </label>
                </div>
              </div>

              <div className="reflection-form-actions">
                <button type="button" className="reflection-cancel-btn" onClick={() => {
                  setShowQuestionForm(false);
                  setEditingQuestion(null);
                  resetQuestionForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="reflection-save-btn">
                  <Save size={16} />
                  {editingQuestion ? 'Update' : 'Create'} Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="reflection-questions-list-view">
        {questions.length === 0 ? (
          <div className="reflection-empty-state">
            <Settings size={48} />
            <h3>No questions yet</h3>
            <p>Click "Add Question" to create your first reflection question.</p>
          </div>
        ) : (
          questions.map((question) => (
            <div key={question.id} className="reflection-question-item">
              <div className="reflection-question-item-header">
                <div className="reflection-question-item-info">
                  <h4>{question.question_text}</h4>
                  <div className="reflection-question-item-meta">
                    <span className="reflection-type-badge">{question.question_type}</span>
                    {question.category && <span className="reflection-category-badge">{question.category}</span>}
                    <span className="reflection-order-badge">Order: {question.order}</span>
                  </div>
                </div>
                <div className="reflection-question-item-actions">
                  <button onClick={() => handleEditQuestion(question)} className="reflection-edit-btn">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDeleteQuestion(question.id)} className="reflection-delete-btn">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {question.question_type === 'choice' && question.choices && (
                <div className="reflection-question-item-choices">
                  {question.choices.map((choice, i) => (
                    <span key={i} className="reflection-choice-chip">{choice}</span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );



  return (
    <div className="reflection-container">
      <Navigation />
      
      {backgroundImage && (
        <div className="reflection-hero-image" style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} />
      )}
      
      <div className="reflection-content">
        <div className="reflection-tabs">
          <button 
            className={`reflection-tab ${view === 'reflection' ? 'active' : ''}`}
            onClick={() => setView('reflection')}
          >
            <BookOpen size={20} />
            Daily Reflection
          </button>
          <button 
            className={`reflection-tab ${view === 'questions' ? 'active' : ''}`}
            onClick={() => setView('questions')}
          >
            <Settings size={20} />
            Manage Questions
          </button>
        </div>

        <div className="reflection-main">
          {view === 'reflection' && renderReflectionView()}
          {view === 'questions' && renderQuestionsView()}
        </div>
      </div>
    </div>
  );
};

export default SelfReflection;
