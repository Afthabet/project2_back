require('dotenv').config(); // Make sure to install dotenv: npm install dotenv

module.exports = {
  HOST: "localhost",
  USER: "www_admin",
  PASSWORD: process.env.DB_PASSWORD, // Uses the password from your .env file
  DB: "www_car_dealership",
  dialect: "postgres",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};