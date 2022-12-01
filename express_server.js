const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs")
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
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

function generateRandomString() {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 1; i <= 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], urls: urlDatabase };
  res.render("urls_index", templateVars);
 });


 app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] }
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

 app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user: users[req.cookies["user_id"]] };
  if (urlDatabase[req.params.id]) {
    res.render("urls_show", templateVars);
  } else {
    res.send("<html><body>The id you requested does not exist and is invalid</b></body></html>\n");
  }
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.send("<html><body>The id you requested does not exist and is invalid</b></body></html>\n");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect(`/urls`);
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls`);
});

// app.post("/logout", (req, res) => {
//   res.clearCookie("username");
//   res.redirect("/urls");
// });

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] }
  res.render("registration_page",templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let userExists = false; 

  if (!email || !password) {
    res.status(400).send('The email address and/or password fields can not be empty');
    return;
  }

  for (let user in users) {
    if (email === users[user]["email"]) {
      userExists = true;
    }
  }
  console.log("userExists:", userExists);
  if (userExists) {
    res.status(400).send('The email address already exists!');
    return;
  }

  const id = generateRandomString();
  users[id] = {id: id, email: email, password: password };
  res.cookie("user_id", id);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] }
  res.render("login_page", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let userExists = false;
  let foundUser;

  //if Email and password fields are empty, return this message
  if (!email || !password) {
    return res.status(400).send('The email address and/or password fields can not be empty');
  }

  //Checks if email exists on the system and assigns if it is, it assigns user ID to foundUser
  for (let user in users) {
    if (email === users[user]["email"]) {
      userExists = true;
      foundUser = users[user];
    }
  }

  //Condition will occur only if email address is not on the system
  if (!userExists) {
    return res.status(403).send('This user does not exist on the system');
  }

  //Condition will occur if user is on the system but password is incorrect
  if (foundUser['password'] !== password) {
    return res.status(403).send('This user exists on the system but password is incorrect');
  }

  //Happy path that userExists and password is correct
  const id = foundUser["id"];
  res.cookie('user_id', id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});