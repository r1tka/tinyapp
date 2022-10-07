function getUserByEmail(email, users) {
  for (let userId in users) {
    if(users[userId].email === email) {
      return users[userId]
    } 
  }
     return null
   }














   module.exports = { getUserByEmail }