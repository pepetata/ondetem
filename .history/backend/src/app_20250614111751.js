require("dotenv").config();
const cors = require("cors");
const express = require("express");
const usersRouter = require("./routes/users");

const app = express();
app.use(express.json());
app.use("/api/users", usersRouter);

app.listen(process.env.PORT || 3000, () => {
  console.log(
    "Backend running on http://localhost:" + (process.env.PORT || 3000)
  );
});
