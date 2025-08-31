// This file is the main entry point for the application.
// It imports the Express app, connects to the database, and starts the server.

const app = require('./src/app'); // Imports your configured Express app
const db = require("./src/models");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const PORT = process.env.PORT || 8080;

// This is the main server start-up.
const startServer = () => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}.`);
  });
};

// Sync database and then start the server
// This ensures the database is ready before the server starts accepting requests.
// UPDATED: Added { alter: true } to update the database schema with the new 'thumbnail' column.
db.sequelize.sync({ alter: true })
  .then(() => {
    console.log("✅ Synced database successfully.");
    startServer(); // Start the server only after the database sync is successful
  })
  .catch((err) => {
    console.log("❌ Failed to sync database: " + err.message);
  });

