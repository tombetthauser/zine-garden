// ~~~~~~~~~~ Basic Setup ~~~~~~~~~~
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const port = process.env.PORT || 8080;
const db = require('./db/models');


// ~~~~~~~~~~ Auth Related? ~~~~~~~~~~
const cookieParser = require('cookie-parser'); // <-- ?
const session = require('express-session'); // <-- ?
// const { restoreUser } = require('./auth'); // <-- ?
const { environment, sessionSecret } = require('./config'); // <-- ?
const { sequelize } = require('./db/models');
const SequelizeStore = require('connect-session-sequelize')(session.Store); // <-- ?
const store = new SequelizeStore({ db: sequelize }); // <-- ?
const createError = require('http-errors');
// const { csrfProtection, asyncHandler } = require('./utils');
// const { loginUser, logoutUser } = require('./auth');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });
const asyncHandler = (handler) => (req, res, next) => handler(req, res, next).catch(next);
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');



// ~~~~~~~~~~ Auth Helper Functions ~~~~~~~~~~
// import access to the database
// const db = require('./db/models');

/*
  ~~~~~~ Log In ~~~~~~
  This sets auth.userId to the req.session
  by creating a little object and assigning
  is to req.session.auth.
*/
const loginUser = (req, res, user) => {
  req.session.auth = {
    userId: user.id,
  };
};


/*
  ~~~~~~ Log Out ~~~~~~
  This just deletes the entire
  req.session.auth object.
*/
const logoutUser = (req, res) => {
  delete req.session.auth;
};


/*
  ~~~~~~ Require Login ~~~~~~
  This checks res.locals.authenticated 
  and redirects to login if it doesn't exist.
  --> But where does res.locals get set?
  --> Also what is the point of next()?
*/
const requireAuth = (req, res, next) => {
  if (!res.locals.authenticated) {
    return res.redirect('/login');
  }
  return next();
};


/*
  ~~~~~~ Set User Object ~~~~~~
  * This checks the req.session for that auth object
  with the userId from the login function.
  * If there is an auth object we pull the userId out and
  try to query the database for the whole user.
  * Then we set res.locals.authenticated to true and set
  res.locals.user to the user's object.
  * If the userId isn't in the database we set the locals.authenticated
  to false and pass the caught error along with next().
  * If the req.session.auth didn't exist to begin with we just
  set res.locals.authenticated to false and call next().
  * Regardless next() is called.
  --> But where does this function actually get called?
*/
const restoreUser = async (req, res, next) => {
  if (req.session.auth) {
    const { userId } = req.session.auth;
    try {
      const user = await db.User.findByPk(userId);
      if (user) {
        res.locals.authenticated = true;
        res.locals.user = user;
        next();
      }
    } catch (err) {
      res.locals.authenticated = false;
      next(err);
    }
  } else {
    res.locals.authenticated = false;
    next();
  }
};



// ~~~~~~~~~~ Basic App Setup ~~~~~~~~~~
const app = express();

app.use(express.static(__dirname + '/'));
app.use(bodyParser.urlencoded({ extend: true }));
app.engine('html', ejs.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname);



// ~~~~~~~~~~ Auth Related? ~~~~~~~~~~
app.use(express.json()); // <-- ?
app.use(cookieParser(sessionSecret)); // <-- ?
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    store,
})); // <-- ?
app.use(express.urlencoded({ extended: false })); // <-- ?
app.use(restoreUser); // <-- ?
// prevents caching, seems to help a little possibly but not totally fixed
app.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})
// create Session table if it doesn't already exist
// wouldn't be necessary if you created a migration for the session table
store.sync();



// ~~~~~~~~~~ Dummy Data ~~~~~~~~~~
testZines = [
  { name: "the cats of star trek", url: "http://www.google.com", author: "elliot s", city: "San Francisco, CA", date: new Date().getFullYear()},
  { name: "getting over being me", url: "http://www.google.com", author: "diana m", city: "Bozeman, MT", date: new Date().getFullYear()},
  { name: "a art bums guide to chicago", url: "http://www.google.com", author: "brady", city: "Santa Fe, NM", date: new Date().getFullYear()},
]


// ~~~~~~~~~~ Validations ~~~~~~~~~~
const loginValidators = [
  check('username').exists({ checkFalsy: true }).withMessage('please provide a username'),
  check('password').exists({ checkFalsy: true }).withMessage('please provide a password')
];

const signupValidations = [
  check('username')
    .exists({ checkFalsy: true }).withMessage('please provide a username')
    .isLength({ min: 3 }).withMessage('username must not be less than 3 characters long')
    .isLength({ max: 50 }).withMessage('username must not be more than 50 characters long')
    .custom(value => !/\s/.test(value))
    .withMessage("spaces are not allowed in username")
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage("crazy characters are not allowed in username")
    .custom((value) => {
      return db.User.findOne({ where: { username: value } })
        .then((user) => {
          if (user) {
            return Promise.reject('username is already in use');
          }
        });
    }),
  check('password')
    .exists({ checkFalsy: true }).withMessage('please provide a value for password')
    .isLength({ min: 3 }).withMessage('password must not be less than 3 characters long')
    .isLength({ max: 50 }).withMessage('password must not be more than 50 characters long')
    .custom(value => !/\s/.test(value))
    .withMessage('spaces are not allowed in your password (you monster)'),
  check('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('confirm password must match password');
    }
    return true;
  }),

  // optionally check password for special characters etc
  // check('password')
  // .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, 'g')
  // .withMessage('Password must contain at least 1 lowercase letter, uppercase letter, number, and special character (i.e. "!@#$%^&*")'),
];

const uploadValidators = [
  check('productionDate').custom(value => {
    let enteredDate = new Date(value);
    let todaysDate = new Date();
    if (enteredDate > todaysDate) {
      throw new Error("production date cannot be in future");
    }
    return true;
  })
];



// ~~~~~~~~~~ Basic Setup ~~~~~~~~~~
app.get('/', function (req, res) {
  // res.sendFile(path.join(__dirname, '/views/test.html'), {"test":"TEST!"});
  res.render(__dirname + '/views/index.html', { zines: testZines });
});

app.get('/make', csrfProtection, function (req, res) {
  res.render(__dirname + '/views/make.html', { user: { username: "" }, errors: [], csrfToken: req.csrfToken() });
});

app.get('/upload', csrfProtection, function (req, res) {
  res.render(__dirname + '/views/upload.html', { title: "jnjnjnj", author: "bbhjjb", productionCity: "ibuibuub", productionDate: "2012-12-03", errors: [], csrfToken: req.csrfToken() });
});

app.get('/login', csrfProtection, function (req, res) {
  if (res.locals.authenticated) {res.redirect('/')}
  res.render(__dirname + '/views/login.html', { user: { username: "" }, errors: [], csrfToken: req.csrfToken()});
});

app.get('/signup', csrfProtection, function (req, res) {
  if (res.locals.authenticated) {res.redirect('/')}
  res.render(__dirname + '/views/signup.html', { user: { username: "" }, errors: [], csrfToken: req.csrfToken()});
});

app.post('/signup', csrfProtection, signupValidations, asyncHandler(async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  console.log({username, password})
  const validatorErrors = validationResult(req);
  const user = db.User.build({ username });
  // const user = { username, password, confirmPassword };

  if (validatorErrors.isEmpty()) {
    const passwordHash = await bcrypt.hashSync(password);
    user.passwordHash = passwordHash;
    user.userType = "normal";
    await user.save();
    loginUser(req, res, user);
    req.session.save(() => {
      res.redirect('/');
    })
  } else {
    const errors = validatorErrors.array().map((error) => error.msg);
    res.render(__dirname + '/views/signup.html', { user, errors, csrfToken: req.csrfToken() });
    // res.redirect('/#failure');
  }
}));

app.post('/login', csrfProtection, loginValidators, asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  let errors = [];
  const validatorErrors = validationResult(req);

  if (validatorErrors.isEmpty()) {
    const user = await db.User.findOne({ where: { username: username }});
    if (user !== null) {
      const passMatch = await bcrypt.compare(password, user.passwordHash.toString());
      if (passMatch) {
        loginUser(req, res, user);
        req.session.save(() => {
          res.redirect('/');
        });
        return;
      }
    }
    errors.push('bad username and / or password');
  } else {
    errors = validatorErrors.array().map(error => error.msg)
  }
  res.render(__dirname + '/views/login.html', { user: "", errors, csrfToken: req.csrfToken() });
}));

app.post('/upload', csrfProtection, uploadValidators, asyncHandler(async (req, res) => {
  const { user, uploadFile, title, author, productionCity, productionDate } = req.body;
  let errors = [];

  console.log(req.body);

  const validatorErrors = validationResult(req);
  // errors.push('test error');

  if (validatorErrors.isEmpty()) {
    const zine = await db.Zine.findOne({ where: { title: title }});
    if (zine !== null) {
      errors.push('zine title already in use');
      // res.redirect('/');
      // return;
    } else {
      const url = "https://www.google.com" // <-- placeholder - save to aws and get real url
      const userId = user ? user.id : null;
      const newZine = db.Zine.build({ url, title, userId, author, productionCity, productionDate });
      await newZine.save();
      res.redirect("/#upload-success!");
      return;
    }
  } else {
    errors = validatorErrors.array().map(error => error.msg)
  }
  res.render(__dirname + '/views/upload.html', { title: "ddddddd", author: "aaaaaa", productionCity: "ooooooo", productionDate: "2014-12-03", errors, csrfToken: req.csrfToken() });
}));

app.post('/logout', (req, res) => {
  logoutUser(req, res);
  req.session.save(() => {
    res.redirect('/');
  })
});


// ~~~~~~~~~~ Error Handling ~~~~~~~~~~
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('./views/error.html', { err });
});



// ~~~~~~~~~~ Export Express App ~~~~~~~~~~
module.exports = app;
