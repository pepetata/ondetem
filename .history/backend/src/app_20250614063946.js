const express = require("express");
const usersRouter = require("./routes/users");

const app = express();
app.use(express.json());
app.use("/api/users", usersRouter);

app.listen(3001, () => console.log("Backend running on http://localhost:3001"));
