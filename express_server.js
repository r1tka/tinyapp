/* eslint-disable camelcase */

// Importing libraries
const express = require("express");
const cookieSession = require('cookie-session');
const chalk = require('chalk');
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");

// Importing helper functions
const { getUserByEmail, urlsForUser, generateRandomString } = require('./helpers');

// Starting server on port 8080
const app = express();
const PORT = 8080;
// Starting ejs templates
app.set("view engine", "ejs");

// Starting cookie session
app.use(cookieSession({
  name: 'session',
  keys: ['qwertasknxkcoiwokjsadkjhsad']
}));

// Using salt for hashing password
const saltRounds = 10;

// Starting middleware that only parses urlencoded bodies and only looks at requests
// where the Content-Type header matches the type option
app.use(bodyParser.urlencoded({extended: true}));

// Url database
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID",
  },
};

// Users registered in the app
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// Listen for connections
app.listen(PORT, () => {
  console.log(chalk.blue.bold("tinyApp listening on"));
  console.log(chalk.yellow.underline.bold(`port: ${PORT}!`));
});

//Root route
app.get("/", (req, res) => {
  const userId = req.session.user_id;
  // Checking if there is userId stored in cookie session. Redirecting user to the main page or login
  if (userId) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// Home route (urls)
app.get("/urls", (req, res) => {
  // Getting userId from cookie session. It can be null
  const userId = req.session.user_id;
  // If not logged in displaying html with relevant message
  if (!userId) {
    res.status(403).send(`<html><body>Please <a href="/login">Log in</a> or 
    <a href="/register">Register</a> for use tinyApp</body></html>`);
  } else {
    // Getting users urls, if no userId returning empty object
    const filterUrlDatabase = userId ? urlsForUser(userId, urlDatabase) : {};
    const templateVars = { urls: filterUrlDatabase, user: users[userId] };
    // Rendering main urls template
    res.render("urls_index",templateVars);
  }
});


// Post route for urls
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  // Checking if there is userId in cookie session
  if (!userId) {
    res.status(403).send(`<h3 style="color: red"><a href="/login">Log in</a> first!</h3>`);
  } else {
    // Creating new short url
    const shortUrl = generateRandomString();
    const newUrl = {longURL: req.body["longURL"], userID: userId};
    urlDatabase[shortUrl] = newUrl;
    // Redirecting to the short url page on success
    res.redirect(`urls/${shortUrl}`);
  }
});


// Route redirecting to the correseponding actual url
app.get("/u/:id", (req, res) => {
  const shortUrl = urlDatabase[req.params.id];
  // Checking if short and long url exists. Redirecting to the actual url,
  // otherwise displaying error message
  if (!shortUrl) {
    res.status(404).send(`<h3 style="color: red">Short url not found!</h3>`);
  } else if (!shortUrl.longURL) {
    res.status(404).send(`<h3 style="color: red">Bad request</h3>`);
  }
  res.redirect(shortUrl.longURL);
});

// Route rendering page, used for creating new shortUrl
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    const templateVars = { user: users[userId] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// Route displaying shortUrl page. Where user can modify this url
app.get("/urls/:id", (req, res) => {
  // Getting userId from cookie session
  const userId = req.session.user_id;
  // Getting user urls
  const userUrls = urlsForUser(userId, urlDatabase);
  // Checking if user is logged in
  if (!userId) {
    res.status(403).send(`<h3 style="color: red">You have to <a href="/login">Log in</a> first!</h3>`);
    // Checking if url exists
  } else if (!urlDatabase[req.params.id]) {
    res.status(400).send(`<h3 style="color: red">This url doesn't exist</h3>`);
    // Checking if url belongs to corresponding user
  } else if (!userUrls[req.params.id]) {
    res.status(403).send(`<h3 style="color: red">You don't own this url</h3>`);
  } else {
    const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user: users[userId]};
    res.render("urls_show", templateVars);
  }
});

// Route for registration page
app.get("/register", (req, res) => {
  // Passing template vars with no user information
  let templateVars = {user: undefined};
  // Getting userId from cookie session
  const userId = req.session.user_id;
  // If there is userId in cookie session redirecting user to the main page,
  // otherwise to the register page
  if (userId) {
    res.redirect("/urls");
  } else {
    res.render("register", templateVars);
  }
});

// Post request for register. Creates new user
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Generating encrypted password
  const hashedPassword = bcrypt.hashSync(password, saltRounds);
  // Checking if requested email and password are not empty
  if (email === "" || password === "") {
    res.status(400).send(`<h3 style="color: red">Please include your information</h3>`);
  }
  // Getting user with incoming email
  const user = getUserByEmail(email, users);
  // If user with this email exists sending error
  if (user) {
    res.status(400).send(`<h3 style="color: red">Sorry, this email is already in use!</h3>`);
  }

  // Generating random userId
  let randomUserId = generateRandomString();
  const newUser = {
    id: randomUserId,
    email: email,
    password: hashedPassword
  };
  users[randomUserId] = newUser;
  req.session.user_id = newUser.id;
  // Redirecting to the main page
  res.redirect("/urls");
});

// Post route for short url. Saves changes for corresponding shortUrl
app.post("/urls/:id", (req, res) => {
  // Getting user id from cookie session
  const userId = req.session.user_id;
  // Getting user database with user's urls
  let myDatabase = urlsForUser(userId, urlDatabase);

  // Checking if user is logged in
  if (!userId) {
    res.status(403).send(`<h3 style="color: red">You have to <a href="/login">Log in</a> first!</h3>`);
    // Checking if url exists
  } else if (!urlDatabase[req.params.id]) {
    res.status(404).send(`<h3 style="color: red">This url doesn't exist</h3>`);
    // Checking if url belongs to corresponding user
  } else if (!myDatabase[req.params.id]) {
    res.status(404).send(`<h3 style="color: red">You don't own this url</h3>`);
  } else {
    // Saving changes to the url
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls");
  }
});

// Route used for delete shortUrl
app.post("/urls/:id/delete", (req, res) => {
  // Getting user id from cookie session
  const userId = req.session.user_id;
  // Getting user database with user's urls
  
  let myDatabase = urlsForUser(userId, urlDatabase);
  if (!userId) {
    // Checking if user is logged in
    res.status(403).send(`<h3 style="color: red">You have to <a href="/login">Log in</a> first!</h3>`);
    // Checking if url exists
  } else if (!urlDatabase[req.params.id]) {
    res.status(404).send(`<h3 style="color: red">This url doesn't exist</h3>`);
    // Checking if url belongs to corresponding user
  } else if (!myDatabase[req.params.id]) {
    res.status(404).send(`<h3 style="color: red">You don't own this url</h3>`);
  } else {
    // Deleting url
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }
});

// Renders login page
app.get("/login", (req, res) => {
  // Setting user to undefined, passing template vars
  const templateVars = {user: undefined};
  const userId = req.session.user_id;
  // If user is logged in redirecting to the main page
  if (userId) {
    res.redirect("/urls");
  } else {
    res.render("login", templateVars);
  }
});

// Post for login. Checks for user with its email and password. Password is hashed
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // Getting user with same email
  const user = getUserByEmail(email, users);
  // Checking if email and password are not empty
  if (!email) {
    res.status(403).send(`<h3 style="color: red">Email field can't be empty</h3>`);
  } else if (!password) {
    res.status(403).send(`<h3 style="color: red">Password field can't be empty</h3>`);
    // If email is not matched
  } else if (!user) {
    res.status(403).send(`<h3 style="color: red">User with this email can't be found</h3>`);
    // If password is not matched
  } else if (!bcrypt.compareSync(password, user.password)) {
    res.status(403).send(`<h3 style="color: red">Wrong password</h3>`);
  } else {
    // Setting cookie session to this user. Redirecting to the main page
    req.session.user_id = user.id;
    res.redirect("/urls");
  }
});

// Post route for logout. User seesion is set to null
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/login");
});

// Test route. Renders html page with helloWorld
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});