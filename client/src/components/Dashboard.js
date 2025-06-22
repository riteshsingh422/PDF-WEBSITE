import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import '../styles.css';

const Dashboard = () => {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('Schematics');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const categories = [
    'Schematics', 'BoardViews', 'SPI Bios', 'T2 Bios', 'Usb -C Bios', 
    'Impedance DV / G.R Value', 'Case Study', 'Digital Oscilloscope', 
    'Images', 'Videos'
  ];

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file first!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file); // Ensure field name is 'file'
    formData.append('category', category);
    console.log('Uploading file:', { file: file.name, category }); // Debug log

    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `Server error (${response.status})`;
        } catch (jsonError) {
          errorMessage = `Server returned ${response.status}: Unable to parse response`;
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      setSuccessMessage(`File "${data.name}" uploaded to "${data.category}" successfully!`);
      setFile(null);
    } catch (error) {
      console.error('Error uploading file:', error.message, error.stack);
      alert(`Failed to upload file: ${error.message}`);
    }
  };

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">Upload your files here</p>
      </div>
      <div className="dashboard-content">
        <div
          className={`upload-card ${file ? 'dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <h3 className="upload-title">Upload File</h3>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="category-select"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <label className="upload-label">
              Choose File
              <input
                type="file"
                onChange={handleFileChange}
                className="upload-input"
              />
            </label>
            <p className="drop-text">or drag and drop your file here</p>
            <button type="submit" className="upload-button">
              Upload
            </button>
          </form>
          {successMessage && <p className="success-message">{successMessage}</p>}
          {file && <p className="success-message">Selected: {file.name}</p>}
        </div>
        <button
          className="view-pdfs-button"
          onClick={() => navigate('/view-pdf/all')}
        >
          View Uploaded Files
        </button>
      </div>
    </div>
  );
};

export default Dashboard;