const getUserByEmail = function(email, database) {
  let foundUser;
  for (let user in database) {
    if (email === database[user]["email"]) {
      foundUser = user;
    }
  }
  return foundUser;
};

module.exports = { getUserByEmail };