require('dotenv').config();

module.exports = {
  development: {
    HOST: "localhost",
    USER: "www_admin",
    PASSWORD: process.env.DB_PASSWORD,
    DB: "www_car_dealership",
    dialect: "postgres",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    use_env_variable: "DATABASE_URL", // tells Sequelize to use process.env.DATABASE_URL
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};
