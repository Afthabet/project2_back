// src/models/index.js
require("dotenv").config();
const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");

const env = process.env.NODE_ENV || "development";
const config = dbConfig[env];

let sequelize;

if (env === "production" && config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
    host: config.HOST,
    dialect: config.dialect,
    pool: config.pool,
  });
}

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require("./user.model.js")(sequelize, Sequelize);
db.Car = require("./car.model.js")(sequelize, Sequelize);
db.CarImage = require("./carImage.model.js")(sequelize, Sequelize);

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

// UPDATED: This re-establishes the relationship between Car and User.
db.Car.belongsTo(db.User, { as: "owner", foreignKey: "owner_id" });
db.User.hasMany(db.Car, { as: "cars", foreignKey: "owner_id" });

module.exports = db;