const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// --- Middleware --
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// FIX: The static path for the 'public' folder was incorrect.
// This ensures that the server correctly serves the `uploads` directory, allowing images to be displayed.
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use("/uploads", express.static("uploads"));

const apiRoutes = require('./routes');
app.use('/api', apiRoutes);
app.post("/api/cars/create", (req, res) => {
  console.log(req.body);
  res.json({ message: "Car created successfully!" });
});
app.listen(8000, () => console.log("Server running on http://localhost:8000"));
// --- Test Route ---
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Chartered Auto backend API.' });
});

module.exports = app;