const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// --- Middleware ---
const allowedOrigins = [
  "http://localhost:5173",
  "http://afthabudheenet.me",
  "https://afthabudheenet.me"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

;

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
