// Load environment variables FIRST. This is the critical change.
const dotenv = require("dotenv");
dotenv.config();

// Now, load the rest of the application modules.
const app = require('./src/app'); // Corrected path to be relative
const db = require("./src/models");

const PORT = process.env.PORT || 8080;

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}.`);
  });
};

const initializeDatabaseAndStartServer = async () => {
  try {
    await db.sequelize.sync();
    console.log("✅ Synced database successfully.");
    startServer();
  } catch (err) {
    console.log("❌ Failed to sync database: " + err.message);
  }
};

initializeDatabaseAndStartServer();

