// controllers/user.controller.js
const db = require("../models");
const User = db.User;
const ActivityLog = db.ActivityLog;
const bcrypt = require('bcryptjs');

exports.findAll = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const { count, rows: users } = await User.findAndCountAll({
      attributes: ['id', 'username', 'email', 'is_superuser', 'is_staff', 'is_active', 'last_login', 'date_joined'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date_joined', 'DESC']]
    });

    res.send({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      users: users
    });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error retrieving users." });
  }
};

exports.create = async (req, res) => {
  try {
    const { username, email, password, is_staff, is_superuser } = req.body;
    if (!username || !password) {
      return res.status(400).send({ message: "Username and password are required." });
    }
    const hashedPassword = bcrypt.hashSync(password, 8);
    const newUser = await User.create({
      username, email, password: hashedPassword, is_staff, is_superuser,
      is_active: true, date_joined: new Date(),
    });
    const userJson = newUser.toJSON();
    delete userJson.password;
    res.status(201).send(userJson);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error creating user." });
  }
};

exports.update = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).send({ message: `User with id=${id} not found.` });

    const { username, email, password, is_staff, is_superuser, is_active } = req.body;
    user.username = username || user.username;
    user.email = email === undefined ? user.email : email;
    user.is_staff = is_staff;
    user.is_superuser = is_superuser;
    user.is_active = is_active;
    if (password) user.password = bcrypt.hashSync(password, 8);

    await user.save();
    const userJson = user.toJSON();
    delete userJson.password;
    res.send(userJson);
  } catch (err) {
    res.status(500).send({ message: "Could not update User with id=" + id });
  }
};

exports.delete = async (req, res) => {
  const id = req.params.id;
  
  // Start a transaction to ensure both operations succeed or fail together
  const transaction = await db.sequelize.transaction();

  try {
    // 1. First, delete all Activity Logs associated with this user
    await ActivityLog.destroy({ where: { user_id: id }, transaction });

    // 2. Then, delete the User
    const num = await User.destroy({ where: { id: id }, transaction });

    if (num == 1) {
      // If successful, commit the transaction
      await transaction.commit();
      res.send({ message: "User was deleted successfully!" });
    } else {
      // If user not found, rollback
      await transaction.rollback();
      res.status(404).send({ message: `Cannot delete User with id=${id}. Maybe User was not found!` });
    }
  } catch (err) {
    // If any error occurs, rollback the transaction
    await transaction.rollback();
    console.error("Error deleting user:", err);
    res.status(500).send({ message: "Could not delete User with id=" + id });
  }
};