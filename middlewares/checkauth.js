const checkAuth = (req, res, next) => {
    if (req.session.student) {
        return next();
    } else {
        return res.status(403).send("Access denied. Please log in to access this resource.");
    }
};

module.exports = checkAuth;
