require("dotenv").config();
const express = require("express");
const app = express();
const port = 3000;

//importazione moduli necessari
const path = require("path");
const postsRouter = require("./routers/posts.js");
const errorsFormatter = require("./middlewares/errorsFormatter.js");
const routeNotFound = require("./middlewares/routeNotFound.js");
const auth = require("./controllers/auth.js");

//Generic middleware
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Definizione rotte
app.post("/login", auth.login);

app.get("/", (req, res) => {
    const filePath = path.join(__dirname, "./index.html");
    res.sendFile(filePath);
});

app.use("/posts", postsRouter);

//middlewares per gestire gli errori
app.use(routeNotFound);
app.use(errorsFormatter);

//Avvio server
app.listen(port, () => {
    console.log(`Server avviato su http://localhost:${port}`);
});
