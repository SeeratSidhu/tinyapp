const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set('view engine', 'ejs');

const urlDatabase = {
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      userID: "aJ48lW"
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "aJ48lW"
  }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  }
};

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] }
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!emailLookup(email)) {
    return res.status(403).send('Email not found. Please register for a new account.');
  }

  const user = emailLookup(email);
  if ( user.password !== password) {
    return res.status(403).send('Incorrect password!');
  }
  res.cookie('user_id', user.id);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  const user = users[req.cookies["user_id"]] || "" ;
  const urls = urlsForUser(req.cookies["user_id"]);
  console.log(urls);
  const templateVars = { 
    urls,
    user
  };

  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  if (!req.cookies["user_id"]) {
    return res.status(403).send("Please login to add a new URL");
  }

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"]
  };
  console.log("Database", urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.get('/register', (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] }
  res.render('register', templateVars);
});

//submit registration form
app.post('/register', (req, res) => {
  const id = generateRandomString();
  const { email, password } = req.body;

  if (!email || !password) {
   return res.status(400).send("Please enter both email and password");
  }

  if (emailLookup(email)) {
    return res.status(400).send("This email already exists! ");
  }

  users[id] = {
    id,
    email,
    password : bcrypt.hashSync(password, 10)
  }
  console.log("users", users);
  res.cookie('user_id', id);
  res.redirect('/urls');
});

//create new short URL
app.get('/urls/new', (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect('/login');
  }
  const templateVars = { user: users[req.cookies["user_id"]] }
  res.render('urls_new', templateVars);
});


app.get('/urls/:shortURL', (req, res) => {
  const user = users[req.cookies["user_id"]] || "";
  const urls = urlsForUser(req.cookies["user_id"]);
  if (!urls[req.params.shortURL]) {
    res.status(403);
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urls[req.params.shortURL],
    user
  };
  res.render('urls_show', templateVars);
});

//update the longURL for a given shortURL
app.post('/urls/:shortURL', (req, res) => {
  const urls = urlsForUser(req.cookies["user_id"]);
  if (!urls[req.params.shortURL]) {
    return res.status(403).send("Access Denied!");
  }
  urlDatabase[req.params.shortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"]
  };
  res.redirect('/urls');
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const urls = urlsForUser(req.cookies["user_id"]);
  if (!urls[req.params.shortURL]) {
    return res.status(403).send("Access Denied!");
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

//shortened link to redirect to the longURL
app.get('/u/:shortURL', (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).render('error_message', {message: 'Invalid URL', url: '/urls'});
  }
  let longURL = urlDatabase[req.params.shortURL].longURL;
  if (!longURL.includes('http://')) {
    longURL = 'http://' + longURL;
  }
  res.redirect(longURL);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

//helper functions
function generateRandomString() {
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
};

function emailLookup(email) {
  for (let user_id in users) {
    const userEmail = users[user_id].email;
    if (userEmail === email) {
      return users[user_id];
    }
  }
  return false;
};

function urlsForUser(id) {
  let output = {};

  for (let url_id in urlDatabase) {
    let user_id = urlDatabase[url_id].userID;
    if (user_id === id) {
      output[url_id] = urlDatabase[url_id].longURL;
    }
  }

  return output;
};