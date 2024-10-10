//importazione moduli
const posts = require("../controllers/posts.js");
const express = require("express");

//Creazione router Express
const router = express.Router();

const auth = require("../controllers/auth.js");
const multer = require("multer");
const uploader = multer({ dest: "public" });

//Definizione rotte post
router.get("/", posts.index);
router.post("/", auth.authenticateUser, uploader.single("image"), posts.store);
router.get("/:slug", posts.show);
router.get("/:slug/download", posts.downloadImage);
router.delete("/:slug", auth.authenticateUser, auth.authenticateAdmin, posts.destroy);

module.exports = router;
