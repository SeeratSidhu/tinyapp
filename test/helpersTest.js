const { expect } = require('chai');

const { generateRandomString, getUserByEmail, urlsForUser } = require('../helpers');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const testUrls = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

describe('getUserByEmail', () => {
  it('should return a user with valid email', () => {
    const user = getUserByEmail('user@example.com', testUsers)
    const expectedUserID = 'userRandomID';
    
    expect(user).to.deep.equal(testUsers[expectedUserID]);
  });

  it('should return false if email does not exist', () => {
    expect(getUserByEmail('hello@xyz.com', testUsers)).to.be.false;
  });
});

describe('generateRandomString', () => {
  it('should return a random string of 6 characters', () => {
    const str = generateRandomString();
    expect(str.length).to.equal(6);
  });
});

describe('urlsForUser', () => {
  it('should return long urls corresponding to the user with given userid', () => {
    const urls = urlsForUser("aJ48lW", testUrls);
    const expectedUrlID = "i3BoGr";
    expect(urls[expectedUrlID]).to.equal(testUrls[expectedUrlID].longURL)
  });

  it("should return empty object if no url are found", () => {
    const urls = urlsForUser("abd652", testUrls);
    expect(urls).to.deep.equal({});
  });
});