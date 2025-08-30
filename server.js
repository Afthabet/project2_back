const app = require('./src/app');
const db = require("./src/models");

import dotenv from "dotenv";
dotenv.config();
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}.`);
});
app.get("/", (req, res) => {
  res.send("🚀 Backend is running on Render!");
});

// Sync database
// In development, you might use { force: true } to drop and re-sync db
db.sequelize.sync()
  .then(() => {
    console.log("✅ Synced database.");
  })
  .catch((err) => {
    console.log("❌ Failed to sync database: " + err.message);
  });