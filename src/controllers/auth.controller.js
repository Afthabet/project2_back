const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = db.User;

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 🔍 Find user by username
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    // 🚨 Prevent login if user is deactivated
    if (user.is_active === false) {
      return res.status(403).send({
        accessToken: null,
        message: "Your account has been deactivated. Please contact support."
      });
    }

    // 🔑 Validate password
    const passwordIsValid = bcrypt.compareSync(password, user.password);

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid password!"
      });
    }

    // 🔐 Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "your-jwt-secret-key", {
      expiresIn: 86400, // 24 hours
    });

    // ✅ Send response
    res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      is_superuser: user.is_superuser,
      is_staff: user.is_staff,
      is_active: user.is_active,
      accessToken: token,
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send({ message: "Internal server error." });
  }
};