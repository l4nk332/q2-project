var express = require('express');
var router = express.Router();
var knex = require('../db/knex');
/* GET users listing. */
router.get('/:username', function(req, res, next) {
  console.log('session cookie username: ' + req.session.username, 'path username is: ' + req.params.username)
  if (req.session.username === req.params.username) {
    // Select all interests from a specific user (given username)
    knex.select('t.id')
        .from('topics as t')
        .join('interests_excels as i_e', 'i_e.topic_id', '=', 't.id')
        .join('users as u', 'u.id', '=', 'i_e.user_id')
        .where('u.username', '=', req.session.username)
        .then(function(interests) {
          interests = interests.map(function(curObj) {
            return curObj.id;
          });
          console.log('interest 1 is: ' + interests);
          // Select recommended users with titles and ids of what they excel at (matching to an array of ids)
            knex('u').distinct('u.username')
              .select('u.id', 'u.first_name', 'u.last_name', 'u.auth_acct', 'u.bio', 'u.available')
              .from('users as u').avg('s.rating')
              .join('interests_excels as i_e', 'i_e.user_id', '=', 'u.id')
              .join('topics as t', 't.id', '=', 'i_e.topic_id')
              .join('sessions as s', 's.mentor', '=', 'u.id')
              .whereIn('t.id', interests)
              .whereNot('u.username', '=', req.session.username)
              .groupBy('u.id', 't.id')
              .then(function(recommendedUsers) {
                res.json(recommendedUsers);
              })
              .catch(function(err) {
                console.log(`There was an error gathering recommended users for user ${req.session.username}: ${err}`);
                res.sendStatus(500);
              });
        })
        .catch(function(err) {
          console.log(`There was an error gathering the interests for user ${req.session.username}: ${err}`);
          res.sendStatus(500);
        });
        // res.render('users.nunjucks', { username: req.session.username });
  } else {
    res.redirect('/login')
  }
});

module.exports = router;
