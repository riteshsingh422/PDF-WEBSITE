import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import Navbar from './Navbar';
import '../styles.css';

const ViewPdf = () => {
  const { pdfId } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [approvalToken, setApprovalToken] = useState(null);
  const [waitingApproval, setWaitingApproval] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility
  const searchInputRef = useRef(null);
  const role = localStorage.getItem('role');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5000/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      const fetchFiles = async () => {
        try {
          const response = await fetch(`http://localhost:5000/files/${selectedCategory}`);
          if (!response.ok) throw new Error('Failed to fetch files');
          const data = await response.json();
          setFiles(data);
        } catch (error) {
          console.error('Error fetching files:', error);
          setFiles([]);
        }
      };
      fetchFiles();
    } else {
      setFiles([]);
    }
  }, [selectedCategory]);

  const renderToolbar = (Toolbar) => (
    <Toolbar>
      {(slots) => {
        const { CurrentPageInput, GoToNextPage, GoToPreviousPage, NumberOfPages, ZoomIn, ZoomOut } =
          slots;
        return (
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', flexWrap: 'wrap' }}>
            <GoToPreviousPage />
            <CurrentPageInput /> / <NumberOfPages />
            <GoToNextPage />
            <ZoomIn />
            <ZoomOut />
          </div>
        );
      }}
    </Toolbar>
  );

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    renderToolbar,
    toolbarPlugin: { downloadPlugin: { disabled: true }, printPlugin: { disabled: true }, openPlugin: { disabled: true } },
  });

  const selectedFile = pdfId === 'all' ? null : files.find((file) => file.id === Number(pdfId));
  const filteredFiles = files.filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSearchQuery('');
    navigate('/view-pdf/all');
  };

  const handleFileClick = (id) => {
    setSelectedFileId(id);
    setShowPasswordModal(true);
    setPassword('');
    setPasswordError('');
    setWaitingApproval(false);
    setShowPassword(false); // Reset password visibility
    if (searchInputRef.current) searchInputRef.current.blur();
  };

  const handlePasswordSubmit = async () => {
    try {
      const response = await fetch('http://localhost:5000/verify-pdf-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfId: selectedFileId, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || 'Incorrect password');
        return;
      }

      setApprovalToken(data.token);
      setWaitingApproval(true);
      setShowPasswordModal(false);

      // Poll for approval
      const interval = setInterval(async () => {
        const checkResponse = await fetch(`http://localhost:5000/check-approval/${data.token}`);
        const checkData = await checkResponse.json();

        if (checkData.approved) {
          clearInterval(interval);
          setWaitingApproval(false);
          navigate(`/view-pdf/${selectedFileId}`);
        } else if (checkData.error) {
          clearInterval(interval);
          setWaitingApproval(false);
          setPasswordError(checkData.error);
          setShowPasswordModal(true);
        }
      }, 2000); // Check every 2 seconds
    } catch (error) {
      console.error('Error verifying password:', error);
      setPasswordError('Something went wrong');
    }
  };

  const handleDelete = async (id) => {
    if (role === 'admin') {
      const fileToDelete = files.find((file) => file.id === id);
      if (!fileToDelete) return;
      try {
        const updatedFiles = files.filter((file) => file.id !== id);
        setFiles(updatedFiles);
        navigate('/view-pdf/all');
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
  };

  const handleClose = () => navigate('/view-pdf/all');

  const isImage = (fileName) => /\.(jpg|jpeg|png|gif)$/i.test(fileName);
  const isVideo = (fileName) => /\.(mp4|webm|ogg)$/i.test(fileName);
  const isPdf = (fileName) => /\.pdf$/i.test(fileName);

  const renderFileViewer = (file) => {
    if (!file) return <p className="error-message">File not found</p>;

    if (isPdf(file.name)) {
      return (
        <div className="pdf-viewer-wrapper">
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <Viewer
              fileUrl={file.url}
              defaultScale={SpecialZoomLevel.PageWidth}
              plugins={[defaultLayoutPluginInstance]}
              withCredentials={false}
            />
          </Worker>
        </div>
      );
    } else if (isImage(file.name)) {
      return <img src={file.url} alt={file.name} style={{ maxWidth: '100%', height: 'auto' }} />;
    } else if (isVideo(file.name)) {
      return (
        <video controls style={{ maxWidth: '100%', height: 'auto' }}>
          <source src={file.url} type={`video/${file.name.split('.').pop().toLowerCase()}`} />
          Your browser does not support the video tag.
        </video>
      );
    } else {
      return <p className="error-message">Unsupported file type: {file.name}</p>;
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="view-pdf-container">
      <Navbar />
      <div className="view-pdf-content">
        {pdfId === 'all' ? (
          <>
            <h1 className="view-pdf-title">View Files</h1>
            {!selectedCategory ? (
              <motion.div
                className="folder-container"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                <div className="header-underline"></div>
                <div className="folder-grid">
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <motion.div
                        key={category}
                        className="folder-card"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => handleCategoryClick(category)}
                      >
                        <div className="folder-icon">📁</div>
                        <span className="folder-name">{category}</span>
                      </motion.div>
                    ))
                  ) : (
                    <p>No folders available.</p>
                  )}
                </div>
              </motion.div>
            ) : (
              <>
                <button className="back-button" onClick={() => setSelectedCategory(null)}>Back to Folders</button>
                <h2 className="category-title">{selectedCategory}</h2>
                <div className="search-bar">
                  <input
                    type="text"
                    name="search-file-random"
                    placeholder="Search files by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                    autoComplete="new-password"
                    ref={searchInputRef}
                  />
                </div>
                <div className="pdf-grid">
                  {filteredFiles.length > 0 ? (
                    filteredFiles.map((file) => (
                      <div key={file.id} className="pdf-card-item" onClick={() => handleFileClick(file.id)}>
                        <div className="pdf-icon">📄</div>
                        <span className="pdf-name">{file.name}</span>
                      </div>
                    ))
                  ) : (
                    <p className="no-results">No files in this category</p>
                  )}
                </div>
              </>
            )}
          </>
        ) : selectedFile ? (
          <div className="pdf-viewer-container">
            <div className="pdf-header">
              <h2 className="pdf-card-title">{selectedFile.name}</h2>
              <div className="pdf-actions">
                <button className="close-button" onClick={handleClose}>Close</button>
                {role === 'admin' && (
                  <button className="delete-button" onClick={() => handleDelete(selectedFile.id)}>Delete</button>
                )}
              </div>
            </div>
            {renderFileViewer(selectedFile)}
          </div>
        ) : (
          <p className="error-message">File not found</p>
        )}
      </div>

      {showPasswordModal && (
        <div className="password-modal-overlay">
          <div className="password-modal">
            <h3>Enter Password</h3>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="password-input"
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
              <span className="eye-icon" onClick={togglePasswordVisibility}>
                {showPassword ? '🙈' : '👁️'}
              </span>
            </div>
            {passwordError && <p className="password-error">{passwordError}</p>}
            <div className="modal-actions">
              <button className="submit-button" onClick={handlePasswordSubmit}>Submit</button>
              <button className="cancel-button" onClick={() => setShowPasswordModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {waitingApproval && (
        <div className="password-modal-overlay">
          <div className="password-modal">
            <h3>Waiting for Approval</h3>
            <p>Please wait for approval from the administrator.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewPdf;