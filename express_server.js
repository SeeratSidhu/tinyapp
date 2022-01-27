const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { generateRandomString, getUserByEmail, urlsForUser } = require('./helpers');

const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'session',
  keys: ["S1mpl!city-k3y", "key2"]
}));
app.set('view engine', 'ejs');

const urlDatabase = {};
const users = {};

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  const templateVars = { user: users[req.session.user_id] }
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).render('error_message', {message: "Please enter both email and password", url: req.header('Referer')});
  }

  if (!getUserByEmail(email, users)) {
  return res.status(403).render('error_message', {message: 'Email not found. Please register for a new account.', url: req.header('Referer')});
  }

  const user = getUserByEmail(email, users);
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).render('error_message', {message: 'Incorrect Password', url: req.header('Referer')});
  }
  req.session.user_id = user.id;
  console.log(req.session.user_id);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  const user = users[req.session.user_id] || "" ;
  const urls = urlsForUser(req.session.user_id, urlDatabase);
  console.log(urls);
  const templateVars = { 
    urls,
    user
  };

  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  if (!req.session.user_id) {
    return res.status(403).send("Please login to add a new URL");
  }

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  console.log("Database", urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.get('/register', (req, res) => {
  const templateVars = { user: users[req.session.user_id]}
  res.render('register', templateVars);
});

//submit registration form
app.post('/register', (req, res) => {
  const id = generateRandomString();
  const { email, password } = req.body;

  if (!email || !password) {
   return res.status(400).render('error_message', {message: "Please enter both email and password", url: req.header('Referer')});
  }

  if (getUserByEmail(email, users)) {
    return res.status(400).render('error_message', {message: "This email already exists!", url: req.header('Referer')});
  }

  users[id] = {
    id,
    email,
    password : bcrypt.hashSync(password, 10)
  }
  console.log("users", users);
  req.session.user_id = id;
  console.log(req.session.user_id);
  res.redirect('/urls');
});

//create new short URL
app.get('/urls/new', (req, res) => {
  if (!req.session.user_id) {
    return res.redirect('/login');
  }
  const templateVars = { user: users[req.session.user_id] }
  res.render('urls_new', templateVars);
});


app.get('/urls/:shortURL', (req, res) => {
  const user = users[req.session.user_id] || "";
  const urls = urlsForUser(req.session.user_id, urlDatabase);
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
  const urls = urlsForUser(req.session.user_id, urlDatabase);
  if (!urls[req.params.shortURL]) {
    return res.status(403).send("Oops! 🚫You cannot update this URL!🚫");
  }

  if (!req.body.longURL) {
    return res.render("error_message", {message: "Please enter a URL to update", url: req.header('Referer')});
  }
    
  urlDatabase[req.params.shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect('/urls');
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const urls = urlsForUser(req.session.user_id, urlDatabase);
  if (!urls[req.params.shortURL]) {
    return res.status(403).send("Oops! 🚫You cannot delete this URL!🚫");
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

//shortened link to redirect to the longURL
app.get('/u/:shortURL', (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).render('error_message', {message: 'Invalid URL. Please check the web address and try again.', url: '/urls'});
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
