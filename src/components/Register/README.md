# Register Component Documentation

## Overview
A modern, responsive registration page with a two-section layout inspired by professional SaaS designs.

## Features

### Left Section (Form Area)
- ✨ Clean, minimalist form design
- 🎨 Soft gradient background (light beige/yellow tones)
- 📝 Input fields for:
  - First Name
  - Last Name
  - Email
  - Password (with show/hide toggle)
  - Confirm Password
- 🔒 Password visibility toggle with eye icon
- ⚡ Real-time form validation
- 🎯 Error and success message handling
- 🔗 Links to Sign In and Terms & Conditions
- 📱 Fully responsive design

### Right Section (Visual Area)
- 🖼️ Beautiful gradient background
- 📋 Floating task card with time
- 📅 Interactive calendar strip (weekly view)
- 👥 Daily meeting card with team avatars
- 🤝 Teamwork illustration placeholder
- ✨ Smooth animations and hover effects

## Technologies Used
- React 18
- Lucide React (for icons)
- CSS3 with animations
- Fetch API for backend integration

## Component Structure

```
Register/
├── Register.jsx    # Main component logic
└── Register.css    # Styles with 'register-' prefix
```

## API Integration

The component connects to the backend API at:
```
POST http://localhost:8000/api/auth/register/
```

### Request Format:
```json
{
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "password": "SecurePass123!",
  "password2": "SecurePass123!"
}
```

### Response Format:
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "date_joined": "2025-10-15T12:00:00Z"
  },
  "tokens": {
    "refresh": "...",
    "access": "..."
  },
  "message": "User registered successfully"
}
```

## Usage

### Basic Usage
```jsx
import Register from './components/Register/Register';

function App() {
  return <Register />;
}
```

### With Router
```jsx
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Register from './components/Register/Register';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## Styling

All CSS classes are prefixed with `register-` to avoid conflicts:
- `.register-container`
- `.register-form-section`
- `.register-input`
- `.register-submit-btn`
- etc.

## Responsive Breakpoints

- **Desktop**: Full two-column layout (40/60 split)
- **Tablet (< 1200px)**: Adjusted proportions (45/55 split)
- **Mobile (< 992px)**: Stacked layout, image section hidden
- **Small Mobile (< 480px)**: Optimized for small screens

## Features in Detail

### Form Validation
- Email format validation
- Password length check (minimum 8 characters)
- Password match verification
- Real-time error clearing

### Password Toggle
- Eye icon to show/hide password
- Applies to both password fields
- Accessible keyboard support

### Error Handling
- Backend validation errors displayed
- Network error handling
- User-friendly error messages

### Success Flow
1. Form submission
2. API call to backend
3. Token storage in localStorage
4. Success message display
5. Automatic redirect to dashboard (2s delay)

## Token Management

Tokens are stored in localStorage:
```javascript
localStorage.setItem('accessToken', data.tokens.access);
localStorage.setItem('refreshToken', data.tokens.refresh);
localStorage.setItem('user', JSON.stringify(data.user));
```

## Accessibility

- ✅ Semantic HTML
- ✅ ARIA labels for icons
- ✅ Keyboard navigation support
- ✅ Focus visible states
- ✅ Screen reader friendly

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Customization

### Colors
Main colors can be changed in `Register.css`:
- Primary: `#FFB74D` (golden yellow)
- Secondary: `#FF9800` (orange)
- Background: `#FFFAF0` (soft beige)

### Fonts
Current: Poppins (Google Fonts)
Can be changed in the CSS import.

### Backend URL
Update the fetch URL in `Register.jsx`:
```javascript
const response = await fetch('YOUR_BACKEND_URL/api/auth/register/', {
  // ...
});
```

## Development

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## Testing

### Manual Testing Checklist
- [ ] Form submits successfully
- [ ] Validation errors display correctly
- [ ] Password toggle works
- [ ] Responsive on all screen sizes
- [ ] Backend integration works
- [ ] Token storage works
- [ ] Redirect after registration works

### API Testing
Make sure the backend is running:
```bash
cd backend
python manage.py runserver
```

## Future Enhancements

- [ ] Add loading spinner on form submission
- [ ] Implement password strength indicator
- [ ] Add email verification flow
- [ ] Support for OAuth login
- [ ] Remember me checkbox
- [ ] Animated transitions between pages

## Troubleshooting

### CORS Errors
Make sure backend `CORS_ALLOWED_ORIGINS` includes frontend URL:
```python
# backend/settings.py
CORS_ALLOWED_ORIGINS = ['http://localhost:5173']
```

### Network Errors
Check:
1. Backend server is running
2. Backend URL is correct
3. Network connection is stable

### Styling Issues
Clear cache and rebuild:
```bash
npm run dev -- --force
```

## License

Part of the InkOdyssey project.
