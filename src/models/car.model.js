// src/models/car.models.js
module.exports = (sequelize, DataTypes) => {
  const Car = sequelize.define("Car", {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false,
    },
    make: DataTypes.STRING(100),
    model: DataTypes.STRING(100),
    year: DataTypes.INTEGER,
    price: DataTypes.DECIMAL(12, 2),
    description: DataTypes.TEXT,
    isAvailable: DataTypes.BOOLEAN,
    mileage: DataTypes.INTEGER,
    color: DataTypes.STRING(50),
    engine: DataTypes.STRING(100),
    transmission: DataTypes.STRING(100),
    features: DataTypes.JSONB,
    stockId: DataTypes.STRING(50),
    trim: DataTypes.STRING(100),
    bodyStyle: DataTypes.STRING(100),
    drivetrain: DataTypes.STRING(100),
    interiorColor: DataTypes.STRING(50),
  }, {
    tableName: "cars_car",   // 👈 important!
    timestamps: false,
  });

  return Car;
};
