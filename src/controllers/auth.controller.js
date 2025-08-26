const db = require("../models");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = db.User;

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Find the user by username
    const user = await User.findOne({ where: { username: username } });

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    // 2. Compare the provided password with the stored hashed password
    const passwordIsValid = bcrypt.compareSync(password, user.password);

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!"
      });
    }

    // 3. If password is valid, create and sign a token
    const token = jwt.sign({ id: user.id }, 'your-jwt-secret-key', {
      expiresIn: 86400 // 24 hours
    });

    // 4. Send the successful response
    res.status(200).send({
      id: user.id,
      username: user.username,
      is_superuser: user.is_superuser,
      email: user.email,
      accessToken: token
    });

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};