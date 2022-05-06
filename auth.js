const fb = require('./db/models');

const loginUser = (req, _res, user) => {
  req.session.auth = {
    userId: user.id
  }
}

const requireAuth = (req, res, next) => {
  
}

module.exports = {
  loginUser
}