import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles.css';

const Navbar = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.removeItem('role');
    navigate('/');
  };

  return (
    <nav className="navbar">
      <h2 className="navbar-brand">PDF Hub</h2>
      <ul className="navbar-links">
        {role === 'admin' ? (
          <>
            <li><Link to="/dashboard">Home</Link></li>
            <li><Link to="/view-pdf/all">View PDFs</Link></li>
            <li>
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </>
        ) : role === 'user' ? (
          <li>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </li>
        ) : null}
      </ul>
    </nav>
  );
};

export default Navbar;