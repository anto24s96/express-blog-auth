const jwt = require("jsonwebtoken");
const users = require("../db/users.json");
require("dotenv").config();

//funzione per generare il token
const generateToken = (user) => jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1h" });

//rotta login
const login = (req, res) => {
    const { username, password } = req.body;
    const user = users.find((u) => u.username === username && u.password === password);

    if (!user) {
        return res.status(404).json({
            error: "Incorrect credentials",
        });
    }

    const token = generateToken(user);

    res.status(200).json({
        userToken: token,
    });
};

const authenticateUser = (req, res, next) => {
    //verifico che l'utente abbia inviato un token
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({
            error: "You must be authenticated",
        });
    }

    //raccolgo il token
    const token = authorization.split(" ")[1];

    //verifico l'autenticità del token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                error: "Expired or invalid token",
            });
        }
        req.user = user;
        next();
    });
};

const authenticateAdmin = (req, res, next) => {
    const { username, password } = req.user;
    const user = users.find((user) => user.username === username && user.password === password);
    if (!user || !user.admin) {
        return res.status(403).json({
            statusCode: 403,
            error: "You are not authorized, you must be admin",
        });
    }
    next();
};

module.exports = {
    generateToken,
    login,
    authenticateUser,
    authenticateAdmin,
};
