const db = require("../models");
const User = db.User;

// Find all users
exports.findAll = (req, res) => {
  User.findAll({
    attributes: ['id', 'username', 'email', 'is_superuser', 'is_staff', 'is_active'] // Don't send passwords
  })
  .then(data => {
    res.send(data);
  })
  .catch(err => {
    res.status(500).send({
      message: err.message || "An error occurred while retrieving users."
    });
  });
};

// Delete a user by ID
exports.delete = (req, res) => {
  const id = req.params.id;

  User.destroy({
    where: { id: id }
  })
  .then(num => {
    if (num == 1) {
      res.send({
        message: "User was deleted successfully!"
      });
    } else {
      res.status(404).send({
        message: `Cannot delete User with id=${id}. Maybe User was not found!`
      });
    }
  })
  .catch(err => {
    res.status(500).send({
      message: "Could not delete User with id=" + id
    });
  });
};