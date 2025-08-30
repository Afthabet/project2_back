require('dotenv').config();

const UPLOADS_PATH = "http://localhost:8080/uploads";

module.exports = {
  UPLOADS_PATH,  // ✅ Exported for imageHelpers or backend routes

  development: {
    HOST: "localhost",
    USER: "www_admin",                 // Your local PostgreSQL username
    PASSWORD: process.env.DB_PASSWORD, // Taken from .env
    DB: "www_car_dealership",          // Your local database name
    dialect: "postgres",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },

  production: {
    use_env_variable: "DATABASE_URL", // Render provides DATABASE_URL
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Required for Render SSL connections
      }
    }
  }
};
