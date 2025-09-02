// src/models/index.js
require("dotenv").config();
const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");

// Determine the environment
const env = process.env.NODE_ENV || "development";
const config = dbConfig[env];

let sequelize;

// Use the correct configuration based on the environment
if (env === "production" && config.use_env_variable) {
  // Production environment (Render)
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  // Development environment (your local machine)
  sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
    host: config.HOST,
    dialect: config.dialect,
    pool: config.pool,
  });
}

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// --- Load models ---
db.User = require("./user.model.js")(sequelize, Sequelize);
db.Car = require("./car.model.js")(sequelize, Sequelize);
db.CarImage = require("./carImage.model.js")(sequelize, Sequelize);
// UPDATED: Removed user-related models that are not currently in use
// db.UserProfile = require("./userProfile.model.js")(sequelize, Sequelize);
// db.ActivityLog = require("./activityLog.model.js")(sequelize, Sequelize);

// --- Define Relationships ---
// This is the only relationship needed for the car and image functionality.
db.Car.hasMany(db.CarImage, {
  foreignKey: "car_id",
  sourceKey: "id",
  as: "images",
});
db.CarImage.belongsTo(db.Car, {
  foreignKey: "car_id",
  targetKey: "id",
  as: "car",
});

// UPDATED: Removed all other relationships related to the user management system
// to prevent server errors.
// db.ActivityLog.belongsTo(db.Car, { as: "car", foreignKey: "car_id" });
// db.ActivityLog.belongsTo(db.User, { as: "user", foreignKey: "user_id" });
// db.UserProfile.belongsTo(db.User, { as: "user", foreignKey: "user_id" });
// db.User.hasOne(db.UserProfile, { as: "profile", foreignKey: "user_id" });
// db.Car.belongsTo(db.User, { as: "owner", foreignKey: "owner_id" });

module.exports = db;