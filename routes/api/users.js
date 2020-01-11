const express = require("express");
const router = express.Router();

//Load controllers
const { login, register } = require('../../controllers/user-controller');

router.post("/register", register);
router.post("/login", login);

module.exports = router;