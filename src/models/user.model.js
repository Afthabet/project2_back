// src/models/user.model.js

module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("auth_user", {
    // Sequelize handles the 'id' field automatically as the primary key
    password: {
      type: Sequelize.STRING(128)
    },
    last_login: {
      type: Sequelize.DATE
    },
    is_superuser: {
      type: Sequelize.BOOLEAN
    },
    username: {
      type: Sequelize.STRING(150),
      unique: true
    },
    first_name: {
      type: Sequelize.STRING(150)
    },
    last_name: {
      type: Sequelize.STRING(150)
    },
    email: {
      type: Sequelize.STRING(254)
    },
    is_staff: {
      type: Sequelize.BOOLEAN
    },
    is_active: {
      type: Sequelize.BOOLEAN
    },
    date_joined: {
      type: Sequelize.DATE
    },
  }, {
    tableName: 'auth_user', // This must match your actual table name
    timestamps: false // Your table does not have createdAt/updatedAt columns
  });

  return User;
};
