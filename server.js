const cors = require("cors");
const express = require("express");
const connectDB = require("./config/db.js");

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/users", require("./routes/users.js"));
app.use("/api/profiles", require("./routes/profiles.js"));
app.use("/api/posts", require("./routes/posts.js"));

connectDB();

app.use(express.static(__dirname + '/public'))

app.get("/", (req, res) => res.send("Server is working correctly"));

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server has started on port ${PORT}`);
})