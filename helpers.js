/* eslint-disable func-style */

// Function used for getting user object from users by provided email
// Return null if no user
function getUserByEmail(email, users) {
  for (let userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
}

// Function returning user urls by checking for incoming userId in urlDatabase.
// Returns empty object if userId not matching userIds in urlDatabase
const urlsForUser = function(userId, urlDatabase) {
  let filterUrlDatabase = {};
    
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === userId) {
      filterUrlDatabase = {...filterUrlDatabase, [key]: urlDatabase[key]};
    }
  }
  return filterUrlDatabase;
};

// Function used for generating random 6 digits alfa-numeric string
function generateRandomString() {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() *
      characters.length));
  }
  return result;
}














module.exports = { getUserByEmail, urlsForUser, generateRandomString };