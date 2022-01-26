const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const res = require('express/lib/response');
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
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

app.get('/', (req, res) => {
  res.send('Hello!');
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
  const templateVars = { 
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
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
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.get('/register', (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] }
  res.render('register', templateVars);
});

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
    password
  }
  console.log(users);
  res.cookie('user_id', id);
  res.redirect('/urls');
});

app.get('/urls/new', (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect('/login');
  }
  const templateVars = { user: users[req.cookies["user_id"]] }
  res.render('urls_new', templateVars);
});


app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.cookies["user_id"]]
  };
  res.render('urls_show', templateVars);
});

//update the longURL for a given shortURL
app.post('/urls/:shortURL', (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect('/urls');
})

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

//shortened link to redirect to the longURL
app.get('/u/:shortURL', (req, res) => {
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