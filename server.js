// This file is the main entry point for the application.
// It imports the Express app, connects to the database, and starts the server.

const app = require('./src/app');
const db = require("./src/models");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const PORT = process.env.PORT || 8080;

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}.`);
  });
};

// UPDATED: Temporarily add { alter: true } to sync schema changes.
const initializeDatabaseAndStartServer = async () => {
  try {
    // This will update your database table to match the model changes.
    await db.sequelize.sync();
    console.log("✅ Synced database successfully.");
    startServer();
  } catch (err)
 {
    console.log("❌ Failed to sync database: " + err.message);
  }
};

initializeDatabaseAndStartServer();