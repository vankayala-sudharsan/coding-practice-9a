const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const bcrypt = require("bcrypt");
app.use(express.json());
const path = require("path");
const dbpath = path.join(__dirname, "userData.db");
let db = null;
const initializedbserver = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server started");
    });
  } catch (e) {
    console.log(`error:${e.message}`);
  }
};
initializedbserver();

app.post("/register", async (request, response) => {
  const userData = request.body;
  const { username, name, password, gender, location } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const isUsernmaeExist = await db.get(userQuery);
  if (isUsernmaeExist !== undefined) {
    response.status = 400;
    response.send("User already exists");
  } else if (userData.password.length < 5) {
    response.status = 400;
    response.send("Password is too short");
  } else {
    const createUserquery = `INSERT INTO user (username,name,password,gender,location)
      VALUES(
          '${username}','${name}','${hashedPassword}','${gender}','${location}'
      );`;
    await db.run(createUserquery);
    response.status = 200;
    response.send("User created successfully");
  }
});

app.post("/login", async (request, response) => {
  const userData = request.body;
  const { username, password } = userData;
  const getUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const isUserexist = await db.get(getUserQuery);

  if (isUserexist === undefined) {
    response.status = 400;
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      isUserexist.password
    );
    if (isPasswordMatched) {
      response.status = 200;
      response.send("Login success!");
    } else {
      response.status = 400;
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const userData = request.body;
  const { username, oldPassword, newPassword } = userData;
  const getUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const userinDb = await db.get(getUserQuery);
  const ispasswordMatched = await bcrypt.compare(
    oldPassword,
    userinDb.password
  );
  if (ispasswordMatched === false) {
    response.status = 400;
    response.send("Invalid current password");
  } else if (newPassword.length < 5) {
    response.status = 400;
    response.send("Password is too short");
  } else {
    const newHashedpassword = await bcrypt.hash(newPassword, 10);
    const query = `UPDATE user SET password = '${newHashedpassword}' WHERE username = '${username}';`;
    await db.run(query);
    response.status = 200;
    response.send("Password updated");
  }
});

module.exports = app;
