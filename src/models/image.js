// backend/src/models/CarImage.js
module.exports = (sequelize, DataTypes) => {
  const CarImage = sequelize.define("cars_carimage", {
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
      defaultValue: 0,
      field: "order"
    },
    car_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  }, {
    tableName: "cars_carimage",
    timestamps: false,
  });

  return CarImage;
};
