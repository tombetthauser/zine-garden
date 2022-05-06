const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const ejs = require('ejs');
// var express = require('express');
// var app = express();

const app = express();

app.use(express.static(__dirname + '/'));
app.use(bodyParser.urlencoded({ extend: true }));
app.engine('html', ejs.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname);

// const port = process.env.PORT || 8080;

testZines = [
  { name: "the cats of star trek", url: "http://www.google.com", author: "elliot s", city: "San Francisco, CA", date: new Date().getFullYear()},
  { name: "getting over being me", url: "http://www.google.com", author: "diana m", city: "Bozeman, MT", date: new Date().getFullYear()},
  { name: "a art bums guide to chicago", url: "http://www.google.com", author: "brady", city: "Santa Fe, NM", date: new Date().getFullYear()},
]

// sendFile will go here
app.get('/', function (req, res) {
  // res.sendFile(path.join(__dirname, '/views/test.html'), {"test":"TEST!"});
  // res.render(__dirname + '/views/test.html', {"test":"TEST??"});
  res.render(__dirname + '/views/splash.html', {test: testZines});
});

app.get('/zines/make', function (req, res) {
  // res.sendFile(path.join(__dirname, '/views/test.html'), {"test":"TEST!"});
  // res.render(__dirname + '/views/test.html', {"test":"TEST??"});
  res.render(__dirname + '/views/make-zine.html', {test: testZines});
});

app.get('/zines/upload', function (req, res) {
  // res.sendFile(path.join(__dirname, '/views/test.html'), {"test":"TEST!"});
  // res.render(__dirname + '/views/test.html', {"test":"TEST??"});
  res.render(__dirname + '/views/upload-zine.html', {test: testZines});
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

module.exports = app;
