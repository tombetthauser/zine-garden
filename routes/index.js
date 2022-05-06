var express = require('express');
var path = require('path');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  // res.render('index', { title: 'a/A Express Skeleton Home' });
  res.send(path.join(__dirname, '/views/test.html'));
});

module.exports = router;
