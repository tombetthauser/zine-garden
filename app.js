// ~~~~~~~~~~ Basic Setup ~~~~~~~~~~
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const port = process.env.PORT || 8080;
const db = require('./db/models');


// ~~~~~~~~~~ Auth Related ~~~~~~~~~~
const cookieParser = require('cookie-parser'); // <-- ?
const session = require('express-session'); // <-- ?
const { environment, sessionSecret } = require('./config'); // <-- ?
const { sequelize } = require('./db/models');
const SequelizeStore = require('connect-session-sequelize')(session.Store); // <-- ?
const store = new SequelizeStore({ db: sequelize }); // <-- ?
const createError = require('http-errors');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });
const asyncHandler = (handler) => (req, res, next) => handler(req, res, next).catch(next);
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');


// ~~~~~~~~~~ AWS Related ~~~~~~~~~~
// const {
//   s3,
//   // NAME_OF_BUCKET,
//   singleMulterUpload,
//   singlePublicFileUpload,
//   // multipleMulterUpload,
//   // multiplePublicFileUpload,
// } = require("./aws.js");
const AWS = require("aws-sdk");
const NAME_OF_BUCKET = "zine-garden";
const multer = require("multer");
const s3 = new AWS.S3({ apiVersion: "2006-03-01" });

const singlePublicFileUpload = async (file) => {
  const { originalname, mimetype, buffer } = await file;
  const path = require("path");
  // name of the file in your S3 bucket will be the date in ms plus the extension name
  const Key = new Date().getTime().toString() + path.extname(originalname);
  const uploadParams = {
    Bucket: NAME_OF_BUCKET,
    Key,
    Body: buffer,
    ACL: "public-read",
  };
  const result = await s3.upload(uploadParams).promise();

  // save the name of the file in your bucket as the key in your database to retrieve for later
  return result.Location;
};

// ~~~~~~~~~~~~~~~ Temporarily Commented Out for PDF Maker ~~~~~~~~~~~~~~~~
const storage = multer.memoryStorage({
  destination: function (req, file, callback) {
    callback(null, "");
  },
});
// const pdfStorage = multer.diskStorage({
//   destination: function (req, file, callback) {
//     callback(null, "");
//   },
// });

const singleMulterUpload = (nameOfKey) => multer({ storage: storage }).single(nameOfKey);
const multipleMulterUpload = (nameOfKey) => multer({ storage: storage }).array(nameOfKey);



// ~~~~~~~~~~ Make PDF Related ~~~~~~~~~~
const fs = require('fs');
const { exec } = require('child_process');
const outputFilePath = Date.now() + "output.pdf"

const pdfStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const imageFilter = function (req, file, cb) {
  if (
    file.mimetype == "image/png" ||
    file.mimetype == "image/jpg" ||
    file.mimetype == "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
    return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
  }
};

const upload = multer({ storage: pdfStorage, fileFilter: imageFilter });

const dir = "public";
const subDirectory = "public/uploads";

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
  fs.mkdirSync(subDirectory);
}

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
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extend: true }));
app.engine('html', ejs.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname);



// ~~~~~~~~~~ Auth Related Setup ~~~~~~~~~~
app.use(express.json()); // <-- ? in AWS setup also
app.use(cookieParser(sessionSecret)); // <-- ?
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    store,
})); // <-- ?
app.use(express.urlencoded({ extended: false })); // <-- ? in AWS setup also
app.use(restoreUser); // <-- ?
// prevents caching, seems to help a little possibly but not totally fixed
app.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})
// create Session table if it doesn't already exist
// wouldn't be necessary if you created a migration for the session table
store.sync();



// ~~~~~~~~~~ Make PDF related setup ~~~~~~~~~~
app.use(bodyParser.json());



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


// ~~~~~~~~~~ Temp PDF maker route ~~~~~~~~~~
app.post('/merge', upload.array('files', 100), (req, res) => {
  let extraMagick = ["-monochrome -gravity center -crop 2:3"];
  list = ""
  if (req.files) {
    req.files.forEach(file => {
      console.log(file.path)

      list += `${file.path}`
      list += " "
    });

    console.log(list)

    exec(`magick convert -resize 1150x850 -monochrome ${list} ${outputFilePath}`, (err, stdout, stderr) => {
      if (err) throw err

      res.download(outputFilePath, (err) => {
        if (err) throw err

        // delete the files which is stored

        req.files.forEach(file => {
          fs.unlinkSync(file.path)
        });

        fs.unlinkSync(outputFilePath)
      })
    })
  }
})


// ~~~~~~~~~~ Half-Page Portrait Side-Stapled Zine ~~~~~~~~~~
app.post('/halfpage-portrait-sidestaple', upload.array('files', 100), (req, res) => {
  // [
  //   "rm ./public/pages/*",
  //   "for ((i=0; i<10; i++)); do \ touch ./public/pages/test-$((i)).txt \ done",
  // ].forEach(command => {
  //   exec(command);
  // })
  if (req.files) {
    // exec(`bash ./public/bashscripts/test.sh`, (err, stdout, stderr) => {
    exec(`bash ./public/bashscripts/test2.sh`, (err, stdout, stderr) => {
      if (err) throw err
  
      res.download("./public/output/test2.pdf", (err) => {
        if (err) throw err
  
        // delete the files which is stored
  
        req.files.forEach(file => {
          fs.unlinkSync(file.path)
        });
  
        // fs.unlinkSync("./public/output/zine.pdf")
        fs.unlinkSync("./public/output/test2.pdf")
      })
    })
  }



})


// ~~~~~~~~~~ Routes ~~~~~~~~~~
app.get('/', csrfProtection, asyncHandler(async (req, res) => {
  // res.sendFile(path.join(__dirname, '/views/test.html'), {"foo":"bar"});
  const zines = await db.Zine.findAll()
  res.render(__dirname + '/views/index.html', { allZines: zines, csrfToken: req.csrfToken(), queryText: "all the zines..."});
}));


app.get('/make', csrfProtection, function (req, res) {
  res.render(__dirname + '/views/make.html', { user: { username: "" }, errors: [], csrfToken: req.csrfToken() });
});

// ~~~~~~~~~~ Not Working / Working PDF Route Above ~~~~~~~~~~
// app.post('/upload', singleMulterUpload("uploadFile"), csrfProtection, uploadValidators, asyncHandler(async (req, res) => {
app.post('/make', upload.array('files', 999), csrfProtection, asyncHandler(async (req, res) => {
  if (req.files) {
    req.files.forEach(file => {
      console.log(file);
    })
  } else {
    console.log("no files?!");
  }
  // res.render(__dirname + '/views/make.html', { user: { username: "" }, errors: [], csrfToken: req.csrfToken() });
}));


app.get('/upload', csrfProtection, function (req, res) {
  res.render(__dirname + '/views/upload.html', { title: "", author: "", productionCity: "", productionDate: "", errors: [], csrfToken: req.csrfToken() });
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


app.post('/upload', singleMulterUpload("uploadFile"), csrfProtection, uploadValidators, asyncHandler(async (req, res) => {
  const { userId, title, author, productionCity, productionDate } = req.body;
  const validatorErrors = validationResult(req);
  let errors = [];

  if (validatorErrors.isEmpty()) {
    const zine = await db.Zine.findOne({ where: { title: title }});
    if (zine !== null) {
      errors.push('zine title already in use');
    } else {
      const fileUrl = await singlePublicFileUpload(req.file);
      const newZine = db.Zine.build({ 
        url: fileUrl, title, userId, author, productionCity, productionDate 
      });
      await newZine.save();
      res.redirect("/#upload-success!");
      return;
    }
  } else {
    errors = validatorErrors.array().map(error => error.msg)
  }
  res.render(__dirname + '/views/upload.html', { title, author, productionCity, productionDate, errors, csrfToken: req.csrfToken() });
}));


app.post('/logout', (req, res) => {
  logoutUser(req, res);
  req.session.save(() => {
    res.redirect('/');
  })
});


app.post('/delete', csrfProtection, asyncHandler(async (req, res) => {
  const { userId, zineId } = req.body;
  const zine = await db.Zine.findOne({ where: { id: zineId } });
  const user = await db.User.findOne({ where: { id: userId } });

  const awsFileSplit = zine.url.split("/");
  const awsFileName = awsFileSplit[awsFileSplit.length - 1];

  if (user.username === 'tom' || user.id === zine.userId) {
    await s3.deleteObject({ Bucket: "zine-garden", Key: awsFileName }, (err, data) => {
      zine.destroy();
      res.redirect('/');
    })
  }
}));


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
