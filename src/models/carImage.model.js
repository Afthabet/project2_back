// src/models/carImage.model.js
module.exports = (sequelize, DataTypes) => {
  const CarImage = sequelize.define("CarImage", {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    image: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    car_id: {
      type: DataTypes.STRING(50), // matches "cars_car.id" type
      allowNull: false,
    },
  }, {
    tableName: "cars_carimage", // exactly your DB table name
    timestamps: false,
  });

  return CarImage;
};
