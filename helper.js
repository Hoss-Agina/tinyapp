const getUserByEmail = function(email, database) {
  let foundUser;
  for (let user in database) {
    if (email === database[user]["email"]) {
      foundUser = user;
    }
  }
  return foundUser;
};

const generateRandomString = function() {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 1; i <= 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

const urlsForUser = function(id, database) {
  let relevantURLDatabase = {};
  for (let keyID in database) {
    if (id === database[keyID]["userID"]) {
      relevantURLDatabase[keyID] = {};
      relevantURLDatabase[keyID]["longURL"] = database[keyID]["longURL"];
      relevantURLDatabase[keyID]["userID"] = database[keyID]["userID"];
    }
  }
  return relevantURLDatabase;
}

module.exports = { getUserByEmail, generateRandomString, urlsForUser };