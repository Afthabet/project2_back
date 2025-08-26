module.exports = (sequelize, Sequelize) => {
  const ActivityLog = sequelize.define("activity_log", {
    action_type: { type: Sequelize.STRING(50) },
    timestamp: { type: Sequelize.DATE },
    details: { type: Sequelize.TEXT },
    car_id: { type: Sequelize.STRING(50) }, // Foreign Key
    user_id: { type: Sequelize.INTEGER } // Foreign Key
  }, { tableName: 'cars_caractivitylog', timestamps: false });
  return ActivityLog;
};