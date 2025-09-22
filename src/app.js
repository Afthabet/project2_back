const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();

// --- Middleware ---
const allowedOrigins = [
  "http://localhost:5173",
  "http://afthabudheenet.me",
  "https://afthabudheenet.me"
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true // This is crucial for sending cookies
}));

;
app.use(cookieParser());
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
