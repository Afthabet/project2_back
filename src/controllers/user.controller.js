const db = require("../models");
const User = db.User;
const bcrypt = require("bcryptjs");

exports.findAll = async (req, res) => {
  try {
    console.log("[USERS] findAll called by user:", req.user?.username);
    const users = await User.findAll({
      attributes: [
        "id",
        "username",
        "email",
        "is_superuser",
        "is_staff",
        "is_active",
        "last_login",
        "date_joined",
      ],
    });
    console.log("[USERS] Returning", users.length, "users.");
    res.status(200).send(users);
  } catch (err) {
    console.error("[USERS] Error retrieving users:", err);
    res.status(500).send({
      message: err.message || "Error retrieving users.",
    });
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
      username,
      email,
      password: hashedPassword,
      is_staff,
      is_superuser,
      is_active: true,
      date_joined: new Date(),
    });

    const userJson = newUser.toJSON();
    delete userJson.password;
    res.status(201).send(userJson);
  } catch (err) {
    console.error("[USERS] Error creating user:", err);
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
    user.email = email ?? user.email;
    user.is_staff = is_staff ?? user.is_staff;
    user.is_superuser = is_superuser ?? user.is_superuser;
    user.is_active = is_active ?? user.is_active;

    if (password) user.password = bcrypt.hashSync(password, 8);

    await user.save();
    const userJson = user.toJSON();
    delete userJson.password;
    res.send(userJson);
  } catch (err) {
    console.error("[USERS] Could not update user:", err);
    res.status(500).send({ message: "Could not update User with id=" + id });
  }
};

exports.delete = async (req, res) => {
  const id = req.params.id;
  try {
    const deleted = await User.destroy({ where: { id } });
    if (deleted === 1) {
      res.send({ message: "User was deleted successfully!" });
    } else {
      res.status(404).send({ message: `Cannot delete User with id=${id}.` });
    }
  } catch (err) {
    console.error("[USERS] Could not delete user:", err);
    res.status(500).send({ message: "Could not delete User with id=" + id });
  }
};
