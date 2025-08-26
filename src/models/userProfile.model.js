module.exports = (sequelize, Sequelize) => {
  const UserProfile = sequelize.define("user_profile", {
    mobile_number: { type: Sequelize.STRING(20) },
    generated_token: { type: Sequelize.STRING(20), unique: true },
    user_id: { type: Sequelize.INTEGER } // Foreign Key
  }, { tableName: 'cars_userprofile', timestamps: false });
  return UserProfile;
};