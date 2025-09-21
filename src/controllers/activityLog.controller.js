const db = require("../models");
const ActivityLog = db.ActivityLog;
const User = db.User;
const Car = db.Car;

exports.findAll = (req, res) => {
  ActivityLog.findAll({
    include: [
        { model: User, as: 'user', attributes: ['username'] }
    ],
    order: [['timestamp', 'DESC']]
  })
  .then(data => {
    res.send(data);
  })
  .catch(err => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving activity logs."
    });
  });
};