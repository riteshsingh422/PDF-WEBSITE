import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ViewPdf from './components/ViewPdf';
import './styles.css';

const App = () => {
  const role = localStorage.getItem('role');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={role === 'admin' ? <Dashboard /> : <Navigate to={role === 'user' ? '/view-pdf/all' : '/'} />}
        />
        <Route
          path="/view-pdf/:pdfId"
          element={
            role === 'admin' || role === 'user' ? <ViewPdf /> : <Navigate to="/" />
          }
        />
        <Route path="*" element={<Navigate to={role === 'user' ? '/view-pdf/all' : '/'} />} />
      </Routes>
    </Router>
  );
};

export default App;