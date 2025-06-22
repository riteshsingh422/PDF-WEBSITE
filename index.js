const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');
const stream = require('stream');

const app = express();
const PORT = 5000;

// MongoDB Connection
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);
let db, bucket;

async function connectToMongoDB() {
  try {
    await client.connect();
    db = client.db('fileStorage');
    bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}
connectToMongoDB();

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ankitsingh07897@gmail.com',
    pass: 'elrj uxrl srbk lgoc',
  },
});

// Initialize pendingApprovals Map
const pendingApprovals = new Map();

app.use(cors());
app.use(express.json());

// Serve static files (for approval page assets)
app.use('/static', express.static(path.join(__dirname, 'public')));

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

// Multer error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err.message, err.stack);
    return res.status(400).json({ error: `Multer error: ${err.message}` });
  }
  next(err);
});

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  console.log('Received upload request:', { category: req.body.category, file: req.file ? req.file.originalname : 'No file' });
  if (!req.file) {
    console.error('No file uploaded');
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const category = (req.body.category || 'Others').replace(/[^a-zA-Z0-9\s\-]/g, '');

  try {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `${uniqueSuffix}-${req.file.originalname}`;
    console.log(`Saving file to MongoDB: ${filename}`);

    const readableStream = new stream.PassThrough();
    readableStream.end(req.file.buffer);
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: { category, originalName: req.file.originalname },
    });
    readableStream.pipe(uploadStream);

    uploadStream.on('finish', () => {
      console.log(`File saved successfully: ${filename}`);
      res.json({
        id: Date.now(), // Keep same ID generation as before
        name: req.file.originalname,
        category,
        url: `http://localhost:${PORT}/file/${uploadStream.id}`,
      });
    });

    uploadStream.on('error', (err) => {
      console.error('Error uploading to GridFS:', err);
      res.status(500).json({ error: 'Failed to save file' });
    });
  } catch (err) {
    console.error('Upload error:', err.message, err.stack);
    res.status(500).json({ error: `Failed to save file: ${err.message}` });
  }
});

// Serve file from GridFS
app.get('/file/:id', async (req, res) => {
  try {
    const fileId = new ObjectId(req.params.id);
    const downloadStream = bucket.openDownloadStream(fileId);

    downloadStream.on('data', (chunk) => {
      res.write(chunk);
    });

    downloadStream.on('end', () => {
      res.end();
    });

    downloadStream.on('error', (err) => {
      console.error('Error retrieving file:', err);
      res.status(404).json({ error: 'File not found' });
    });
  } catch (err) {
    console.error('Error serving file:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify password and request approval
app.post('/verify-pdf-access', (req, res) => {
  const { pdfId, password } = req.body;
  const CORRECT_PASSWORD = 'secret123';

  if (password !== CORRECT_PASSWORD) {
    console.error('Incorrect password attempt:', { pdfId });
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const token = uuidv4();
  pendingApprovals.set(token, { pdfId, userPassword: password, approved: false });

  const approvalLink = `http://192.168.0.9:${PORT}/approve/${token}`;
  const mailOptions = {
    from: 'ankitsingh07897@gmail.com',
    to: 'ankitsingh07897@gmail.com',
    subject: `Click to Approve Access for PDF ID ${pdfId}`,
    html: `
      <h3>File Access Approval Request</h3>
      <p>A user is requesting access to PDF ID <strong>${pdfId}</strong>.</p>
      <p><a href="${approvalLink}">Click here to approve access</a></p>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error.message, error.stack);
      return res.status(500).json({ error: 'Failed to send email' });
    }
    console.log(`Email sent: ${info.response}, Approval link: ${approvalLink}`);
    res.json({ token, message: 'Waiting for approval' });
  });
});

// Approval endpoint with styled page
app.get('/approve/:token', (req, res) => {
  const { token } = req.params;
  const approval = pendingApprovals.get(token);

  if (!approval) {
    console.error('Invalid approval token:', token);
    return res.status(404).sendFile(path.join(__dirname, 'public', 'error.html'));
  }

  approval.approved = true;
  pendingApprovals.set(token, approval);
  console.log(`Approval granted for token: ${token}`);
  res.sendFile(path.join(__dirname, 'public', 'approved.html'));
});

// Check approval status
app.get('/check-approval/:token', (req, res) => {
  const { token } = req.params;
  const approval = pendingApprovals.get(token);

  if (!approval) {
    console.error('Invalid or expired approval token:', token);
    return res.status(404).json({ error: 'Invalid or expired token' });
  }

  if (approval.approved) {
    pendingApprovals.delete(token);
    console.log(`Approval confirmed for token: ${token}, pdfId: ${approval.pdfId}`);
    return res.json({ approved: true, pdfId: approval.pdfId });
  }

  res.json({ approved: false });
});

// Categories and files endpoints
app.get('/categories', (req, res) => {
  console.log('Fetching categories');
  const categories = [
    'Schematics', 'BoardViews', 'SPI Bios', 'T2 Bios', 'Usb -C Bios', 
    'Impedance DV / G.R Value', 'Case Study', 'Digital Oscilloscope', 
    'Images', 'Videos'
  ];
  res.json(categories);
});

app.get('/files/:category', async (req, res) => {
  const category = req.params.category;
  console.log(`Fetching files for category: ${category}`);

  try {
    const files = await bucket.find({ 'metadata.category': category }).toArray();
    const fileList = files.map((file, index) => ({
      id: index + 1, // Match original ID generation
      name: file.metadata.originalName,
      url: `http://localhost:${PORT}/file/${file._id}`,
    }));
    console.log(`Found ${fileList.length} files in category: ${category}`);
    res.json(fileList);
  } catch (err) {
    console.error('Error fetching files:', err);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://192.168.0.9:${PORT}`);
});