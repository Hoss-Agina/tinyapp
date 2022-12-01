const express = require("express");
const cookieParser = require('cookie-parser');
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs")
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
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

function urlsForUser(id) {
  let relevantURLDatabase = {};
  for (let keyID in urlDatabase) {
    if (id === urlDatabase[keyID]["userID"]) {
      relevantURLDatabase[keyID] = {};
      relevantURLDatabase[keyID]["longURL"] = urlDatabase[keyID]["longURL"];
      relevantURLDatabase[keyID]["userID"] = urlDatabase[keyID]["userID"];
    }
  }
  return relevantURLDatabase;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const user = users[req.cookies["user_id"]];
  if (!user) {
    res.send("You must be logged in to see this /urls page");
    return;
  }
  const filteredURLDatabase = urlsForUser(user["id"]);
  // console.log("filteredURLDatabase:", filteredURLDatabase);
  const templateVars = { user: user, urls: filteredURLDatabase };
  res.render("urls_index", templateVars);
 });

 app.get("/urls/new", (req, res) => {
  const user = users[req.cookies["user_id"]]
  const templateVars = { user: user }
  if (!user) {
    res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const user = users[req.cookies["user_id"]];
  if (!user) {
    res.send("You can not shorten URLS because you're NOT registered/Logged in");
    return;
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL]["longURL"] = req.body.longURL;
  urlDatabase[shortURL]["userID"] = user["id"];
  res.redirect(`/urls/${shortURL}`);
});

 app.get("/urls/:id", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const shortURL = req.params.id;
  //Condition to send message to user to sign in if they are not
  if (!user) {
    return res.send("You must login first");
  }
  //Condition to check if shortURL exists in the database
  if (!urlDatabase[shortURL]) {
    return res.send("The short URL does not exist in the system")
  }
  //Condition to check if shortURL belongs to the user
  if (user.id !== urlDatabase[shortURL]["userID"]) {
    return res.send("the short URL exists but you do not own it")
  }
  //Happy path to display url details to the owner
  const templateVars = { id: req.params.id, longURL: urlDatabase[shortURL]["longURL"], user: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]["longURL"];
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.send("The id you requested does not exist and is invalid\n");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const id = req.params.id;
  let idExists = false;

  //Iterating through userDatabase to check if id exists
  for (let idOfDatabase in urlDatabase) {
    if (idOfDatabase === id) {
      idExists = true;
    }
  }
  //Condition to return relevant error if id does not exist
  if (!idExists) {
    return res.send("The id does not exist");
  }
  //Condition to return that customer must login first if they are not signed in
  if (!user) {
    return res.send("You must login first")
  }
  //Condition to return that user does not own shortID to make changes
  if (urlDatabase[id]["userID"] !== user.id) {
    return res.send("You do not own URL to make changes")
  }
  delete urlDatabase[id];
  res.redirect(`/urls`);
});

app.post("/urls/:id", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const id = req.params.id;
  let idExists = false;
  //Iterating through userDatabase to check if id exists
  for (let idOfDatabase in urlDatabase) {
    if (idOfDatabase === id) {
      idExists = true;
    }
  }
  //Condition to return relevant error if id does not exist
  if (!idExists) {
    return res.send("The id does not exist");
  }
  //Condition to return that customer must login first if they are not signed in
  if (!user) {
    return res.send("You must login first")
  }
  //Condition to return that user does not own shortID to make changes
  if (urlDatabase[id]["userID"] !== user.id) {
    return res.send("You do not own URL to make changes")
  }
  urlDatabase[id]["longURL"] = req.body.longURL;
  res.redirect(`/urls`);
});

app.get("/register", (req, res) => {
  const user = users[req.cookies["user_id"]]
  const templateVars = { user: user }
  if (user) {
    res.redirect("/urls");
    return;
  }
  res.render("registration_page",templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
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
  users[id] = {id: id, email: email, password: hashedPassword };
  res.cookie("user_id", id);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const user = users[req.cookies["user_id"]]
  const templateVars = { user: user };
  if (user) {
    res.redirect("/urls");
    return;
  }
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
  if (!bcrypt.compareSync(password, foundUser['password'])) {
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