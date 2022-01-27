const generateRandomString = function() {
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
};

const getUserByEmail = function(email, database) {
  for (let user_id in database) {
    const userEmail = database[user_id].email;
    if (userEmail === email) {
      return database[user_id];
    }
  }
  return false;
};

const urlsForUser = function(id, database) {
  let output = {};

  for (let url_id in database) {
    let user_id = database[url_id].userID;
    if (user_id === id) {
      output[url_id] = database[url_id].longURL;
    }
  }
  return output;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  urlsForUser
};