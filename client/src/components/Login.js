import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showUserLogin, setShowUserLogin] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false);
  const navigate = useNavigate();

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (email === 'admin' && password === 'admin@123') {
      localStorage.setItem('role', 'admin');
      console.log('Admin login successful, role set to:', localStorage.getItem('role')); // Debug
      navigate('/dashboard');
    } else {
      setError('Invalid admin credentials');
    }
  };

  const handleUserLogin = (e) => {
    e.preventDefault();
    if (userEmail === 'user' && userPassword === 'user@123') {
      localStorage.setItem('role', 'user');
      console.log('User login successful, role set to:', localStorage.getItem('role')); // Debug
      navigate('/view-pdf/all');
    } else {
      setError('Invalid user credentials');
    }
  };

  const toggleAdminPasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleUserPasswordVisibility = () => {
    setShowUserPassword(!showUserPassword);
  };

  return (
    <div className="login-container">
      {!showUserLogin ? (
        <div className="login-box">
          <h2 className="login-title">Admin Login</h2>
          <form onSubmit={handleAdminLogin} autoComplete="off">
            <div className="input-group">
              <label>Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="new-email"
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <span className="eye-icon" onClick={toggleAdminPasswordVisibility}>
                  {showPassword ? '🙈' : '👁️'}
                </span>
              </div>
            </div>
            <button type="submit" className="login-button">
              Login
            </button>
            {error && <p className="error-message">{error}</p>}
          </form>
          <p
            className="user-login-link"
            onClick={() => {
              setShowUserLogin(true);
              setError('');
              setShowPassword(false);
            }}
          >
            Login as a User
          </p>
        </div>
      ) : (
        <div className="login-box">
          <h2 className="login-title">User Login</h2>
          <form onSubmit={handleUserLogin} autoComplete="off">
            <div className="input-group">
              <label>Email</label>
              <input
                type="text"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                required
                autoComplete="new-email"
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showUserPassword ? 'text' : 'password'}
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <span className="eye-icon" onClick={toggleUserPasswordVisibility}>
                  {showUserPassword ? '🙈' : '👁️'}
                </span>
              </div>
            </div>
            <button type="submit" className="login-button">
              Login
            </button>
            {error && <p className="error-message">{error}</p>}
          </form>
          <p
            className="user-login-link"
            onClick={() => {
              setShowUserLogin(false);
              setError('');
              setShowUserPassword(false);
            }}
          >
            Back to Admin Login
          </p>
        </div>
      )}
    </div>
  );
};

export default Login;