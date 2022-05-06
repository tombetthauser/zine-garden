// ~~~~~~~~~~ Basic Setup ~~~~~~~~~~
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const port = process.env.PORT || 8080;


// ~~~~~~~~~~ Auth Related? ~~~~~~~~~~
const cookieParser = require('cookie-parser'); // <-- ?
const session = require('express-session'); // <-- ?
const { restoreUser } = require('./auth'); // <-- ?
const { environment, sessionSecret } = require('./config'); // <-- ?
const { sequelize } = require('./db/models');
const SequelizeStore = require('connect-session-sequelize')(session.Store); // <-- ?
const store = new SequelizeStore({ db: sequelize }); // <-- ?
const createError = require('http-errors');
// const { csrfProtection, asyncHandler } = require('./utils');
const { loginUser, logoutUser } = require('./auth');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });
const asyncHandler = (handler) => (req, res, next) => handler(req, res, next).catch(next);




// ~~~~~~~~~~ Basic Setup ~~~~~~~~~~
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



// ~~~~~~~~~~ Basic Setup ~~~~~~~~~~
app.get('/', function (req, res) {
  // res.sendFile(path.join(__dirname, '/views/test.html'), {"test":"TEST!"});
  res.render(__dirname + '/views/index.html', {test: testZines});
});

app.get('/make', function (req, res) {
  res.render(__dirname + '/views/make.html', {test: testZines});
});

app.get('/upload', function (req, res) {
  res.render(__dirname + '/views/upload.html', {test: testZines});
});

app.get('/login', csrfProtection, function (req, res) {
  res.render(__dirname + '/views/login.html', {test: testZines});
});

app.get('/signup', csrfProtection, function (req, res) {
  res.render(__dirname + '/views/signup.html', { csrfToken: req.csrfToken()});
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
  res.render('error');
});






// app.listen(port);
// console.log('Server started at http://localhost:' + port);

// const express = require('express');
// const logger = require('morgan');
// const cookieParser = require('cookie-parser');
// const session = require('express-session');

// const createError = require('http-errors');
// const path = require('path');
// const { sequelize } = require('./db/models');
// const SequelizeStore = require('connect-session-sequelize')(session.Store);
// const indexRouter = require('./routes/index');
// const usersRouter = require('./routes/users');

// const app = express();

// // view engine setup
// app.set('view engine', 'pug');

// app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

// // set up session middleware
// const store = new SequelizeStore({ db: sequelize });

// app.use(
//   session({
//     secret: 'superSecret',
//     store,
//     saveUninitialized: false,
//     resave: false,
//   })
// );

// // create Session table if it doesn't already exist
// store.sync();

// app.use('/', indexRouter);
// app.use('/users', usersRouter);

// // catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function (err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });



// ~~~~~~~~~~ Export Express App ~~~~~~~~~~
module.exports = app;
