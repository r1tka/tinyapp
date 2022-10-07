const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser')

app.set("view engine", "ejs");
app.use(cookieParser());

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
 const urlsForUser = function(userId) {
  let filterUrlDatabase = {}
  
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === userId ) {
      filterUrlDatabase = {...filterUrlDatabase, [key]: urlDatabase[key]}
    }
   }
 return filterUrlDatabase
 }
// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };
//global object
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
 
function getUserByEmail(email) {
  for (let userId in users) {
    if(users[userId].email === email) {
      return users[userId]
    } 
  }
     return null
   }

function generateRandomString() {
  let result = ""
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for ( let i = 0; i < 6; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * 
    characters.length));
  }  
  return result; 
}



app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls", (req, res) => {
  const userId = req.cookies.user_id
  const filterUrlDatabase = urlsForUser(userId)
  const templateVars = { urls: filterUrlDatabase, user: users[userId] };
  // if(!userId) {
  //   res.send("Log in please!")
  // }
  res.render("urls_index",templateVars)
});

app.post("/urls", (req, res) => {
  const userId = req.cookies.user_id
  if (!userId) {
    res.send("Log in first!")
  }
  const shortUrl = generateRandomString()
  const newUrl = {longURL: req.body["longURL"], userID: userId}
  urlDatabase[shortUrl] = newUrl
  res.redirect(`urls/${shortUrl}`); 
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL
  if(!longURL) {
    res.status(404).send("Not found!")
  }
  res.redirect(longURL);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies.user_id
  if (userId) {
    const templateVars = { user: users[userId] };
    res.render("urls_new", templateVars);
  } else {
  res.redirect("/login");
  }
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies.user_id
  if (urlsForUser(userId)) {
    const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user: users[userId]};
    res.render("urls_show", templateVars)
  } else {
    res.redirect("/urls")
  }
});

app.get("/register", (req, res) => {
  let templateVars = {user: undefined}
  const userId = req.cookies.user_id
  if (userId) {
    res.redirect("/urls")
  } else {
  res.render("register",templateVars);
  }
});

app.post("/register", (req, res) => {
  const email = req.body.email
  const password = req.body.password
  if (email === "" || password === "") {
    res.status(400).send("Please include your information")
  }
  if (getUserByEmail(email))  { 
  res.status(400).send("Sorry, this email is already in use!")
  }
  //create a new user object
  let randomUserId = generateRandomString()
  const newUser = {
    id: randomUserId,
    email: email,
    password: password
  }
  //add a new user object to the global user object
  users[randomUserId] = newUser
  //set the cookie to the user id
  res.cookie("user_id", newUser.id )
  //redirect
  res.redirect("/urls")
})

app.post("/urls/:id", (req, res) => {
  const userId = req.cookies.user_id
  let myDatabase = urlsForUser(userId)

  if (!userId) {
    res.send("You have to log in!")
  } else if (!urlDatabase[req.params.id]) {
    res.send("This url doesn't exist")
  } else if (!myDatabase[req.params.id]) {
    res.send("You don't own this url")
  } else {
    urlDatabase[req.params.id].longURL = req.body.longURL
    res.redirect("/urls")
  }
})
 
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.cookies.user_id
  let myDatabase = urlsForUser(userId)
  const shortUrl = req.params.id


  if (!userId) {
    res.send("You have to log in!")
  } else if (!urlDatabase[req.params.id]) {
    res.send("This url doesn't exist")
  } else if (!myDatabase[req.params.id]) {
    res.send("You don't own this url")
  } else {
     delete urlDatabase[req.params.id]
     res.redirect("/urls")
  }
 });

 app.get("/login", (req, res) => {
  templateVars = {user: undefined}
  const userId = req.cookies.user_id
  if (userId) {
    res.redirect("/urls")
   } else {
    res.render("login",templateVars);
  }
});

 app.post("/login", (req, res) => {
  const userId = req.cookies.user_id
  const email = req.body.email
  const password = req.body.password
  const user = getUserByEmail(email)
  if(!user) {
    res.status(403).send("User with this email cannot be found")
  }
  if (user.password !== password) {
    res.status(403).send("Wrong password")
  }
  res.cookie("user_id",user.id)
  res.redirect("/urls")
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
  res.redirect("/urls")
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.get("/", (req, res) => {
  res.send("Hello!");
});
