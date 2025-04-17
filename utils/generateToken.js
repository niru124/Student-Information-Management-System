const jwt = require("jsonwebtoken");
require('dotenv').config();

const generateToken = (user) => {
    const payload = { id: user.id, email: user.email };
    const secret = process.env.JWT_KEY; // Use environment variable or default
    const options = { expiresIn: '1h' }; // Token expiration time

    return jwt.sign(payload, secret, options);
}

module.exports.generateToken = generateToken;

