const express = require("express");
const cookieSession = require('cookie-session')
const bcrypt = require("bcryptjs");

//Helper functions 
const { getUserByEmail } = require("./helper"); 
const { generateRandomString } = require("./helper");
const { urlsForUser } = require("./helper");

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: false }));
app.use(cookieSession({
  name: 'session',
  keys: ["my secret"],
}))

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

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.send("You must be logged in to see this /urls page");
    return;
  }
  const filteredURLDatabase = urlsForUser(user["id"], urlDatabase);
  const templateVars = { user: user, urls: filteredURLDatabase };
  res.render("urls_index", templateVars);
 });

 app.get("/urls/new", (req, res) => {
  const user = users[req.session.user_id]
  const templateVars = { user }
  if (!user) {
    res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const user = users[req.session.user_id];
  if (!user) {
    res.send("You can not shorten URLS because you're NOT registered/Logged in");
    return;
  }
  // Condition to check if user left long URL field blank and returns relevant error message
  if (!req.body.longURL) {
    res.send("You can not leave the long URL blank");
    return;
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {};
  // Condition to check if user included https:// or http:// before entering URL and if not, it will insert it for them
  if (!longURL.includes("https://") && !longURL.includes("http://")) {
    urlDatabase[shortURL]["longURL"] = "https://" + longURL;
    urlDatabase[shortURL]["userID"] = user["id"];
    return res.redirect(`/urls/${shortURL}`);
  }
  urlDatabase[shortURL]["longURL"] = longURL;
  urlDatabase[shortURL]["userID"] = user["id"];
  res.redirect(`/urls/${shortURL}`);
});

 app.get("/urls/:id", (req, res) => {
  const user = users[req.session.user_id];
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
  const templateVars = { id: req.params.id, longURL: urlDatabase[shortURL]["longURL"], user: users[req.session.user_id] };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  //Condition to check if shortURL exists in database, if it doesn't then it returns relevant error message
  console.log("urlDatabase checked before passed to /u/:id", urlDatabase);
  console.log("parameter passed: ",req.params.id);
  if (!urlDatabase[req.params.id]) {
    res.send("This URL does not exist in the system so you won't be redirected anywhere");
    return;
  }
  const longURL = urlDatabase[req.params.id]["longURL"];
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  const user = users[req.session.user_id];
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
  const user = users[req.session.user_id];
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
  //Happy path to let user make change to URL 
  const updatedLongURL = req.body.longURL;
  // Condition to check if user left long URL field blank and returns relevant error message
  if (!updatedLongURL) {
    res.send("You can not leave the long URL blank");
    return;
  }
  // Condition to check if user included https:// or http:// before entering URL and if not, it will insert it for them
  if (!updatedLongURL.includes("https://") && !updatedLongURL.includes("http://")) {
    urlDatabase[id]["longURL"] = "https://" + updatedLongURL;
    return res.redirect(`/urls`);
  }
  urlDatabase[id]["longURL"] = updatedLongURL;
  res.redirect(`/urls`);
});

app.get("/register", (req, res) => {
  const user = users[req.session.user_id]
  const templateVars = { user }
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
  //Condition to check if email or password fields are empty
  if (!email || !password) {
    res.status(400).send('The email address and/or password fields can not be empty');
    return;
  }
  //Checking if email is alreeady registered on the system and returning relevant message
  if (Boolean(getUserByEmail(email, users))) {
    res.status(400).send('The email address already exists!');
    return;
  }
  //Happy Path to register new user with new email address
  const id = generateRandomString();
  users[id] = {id , email , password: hashedPassword };
  req.session.user_id = id; 
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const user = users[req.session.user_id]
  const templateVars = { user };
  if (user) {
    res.redirect("/urls");
    return;
  }
  res.render("login_page", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  //if Email and password fields are empty, return this message
  if (!email || !password) {
    return res.status(400).send('The email address and/or password fields can not be empty');
  }

  //Condition will occur only if email address is not on the system
  let foundUser = getUserByEmail(email, users);
  if (!Boolean(foundUser)) {
    return res.status(403).send('This user does not exist on the system');
  }

  //Condition will occur if user is on the system but password is incorrect
  if (!bcrypt.compareSync(password, users[foundUser]['password'])) {
    return res.status(403).send('This user exists on the system but password is incorrect');
  }

  //Happy path that userExists and password is correct
  const id = foundUser;
  req.session.user_id = id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});