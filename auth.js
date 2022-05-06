// import access to the database
const db = require('./db/models');

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


// ~~~~~ Export all Functions ~~~~~
module.exports = {
  loginUser,
  logoutUser,
  requireAuth,
  restoreUser,
};