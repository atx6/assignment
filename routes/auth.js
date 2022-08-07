const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = mongoose.model("User");
const Ticket = mongoose.model("Ticket");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const { JWT_SECRET } = require("../config/keys");
const requireLogin = require("../middleware/requireLogin");

router.get("/protected", requireLogin, (req, res) => {
  res.send("hello user");
});

// To signup a new user and return bearer token
router.post("/users/new", (req, res) => {
  const { username, role } = req.body;
  if (!username || !role) {
    return res.status(422).json({ error: "Please fill all the fields" });
  }
  User.findOne({ username: username }).then((savedUser) => {
    if (savedUser) {
      return res
        .status(422)
        .json({ error: "User with given username already exists" });
    }
    const user = new User({
      username: username,
      role: role,
    });
    user
      .save()
      .then((user) => {
        // res.json({message:"User Saved Successfully"})
        const token = jwt.sign({ _id: user._id }, JWT_SECRET);
        res.json({ token });
      })
      .catch((err) => {
        console.log(err);
      });
  });
});

// add new ticket
router.post("/tickets/new", requireLogin, (req, res) => {
  const { title, description } = req.body;
  const data = new Ticket({
    _id: uuid.v4(),
    title,
    description,
  });
  data
    .save()
    .then((result) => {
      res.json({ details: result._id });
    })
    .catch((err) => {
      console.log(err);
    });
});

//show all tickets
router.get("/tickets/all", requireLogin, (req, res) => {
  Ticket.find()
    .populate(
      "detailOf",
      "_id title description status priority assignedTo createdAt"
    )
    .then((details) => {
      res.json({ details });
    })
    .catch((err) => {
      console.log(err);
    });
});

//delete ticket
router.get("/tickets/delete", requireLogin, (req, res) => {
  const { user, ticketId } = req.body;
  if (user.role === "admin") {
    Ticket.findByIdAndDelete(ticketId)
      .then((result) => {
        res.json({ deletedTicket: ticketId });
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    res.json({ error: "Only admin can delete a ticket" });
  }
});

module.exports = router;
