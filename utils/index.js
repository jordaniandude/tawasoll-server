const jwt = require("jsonwebtoken");
const config = require("config");
const multer = require("multer");

const auth = (req, res, next) => {
  // Get the token from the request header
  console.log("in auth before token")
  const token = req.header("x-auth-token");
  console.log("token:"+token)

  if (!token) {
    return res
      .status(401)
      .json({ msg: "Token is not available, authorization denied." });
  }

  try {
    jwt.verify(token, config.get("jwtSecret"), (error, decoded) => {
      if (error) {
        return res
          .status(401)
          .json({ msg: "Token is not valid, authorization denied." });
      } else {
        console.log("inside else: ")
        console.log("DECODED "+ JSON.stringify(decoded.user))
        req.user = decoded.user;
        next();
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}`)
  }
});

const upload = multer({storage: storage}).single("file");

module.exports = { auth, upload };
