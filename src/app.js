const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// --- Middleware ---
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ Serve only uploads (public/uploads) at /uploads
app.use("/uploads", express.static(path.join(__dirname, '..', 'public/uploads')));

// --- API Routes ---
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// --- Test Route ---
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Chartered Auto backend API.' });
});

// The app is exported to be started by server.js
module.exports = app;
