module.exports = function(app, passport, db) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        db.collection('messages').find().toArray((err, result) => {
          if (err) return console.log(err)
          res.render('profile.ejs', {
            user : req.user,
            messages: result
          })
        })
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // search query to find therapist by zipcode
    app.get('/search?apple&oranges',  function(req, res) { // ask soemone about proper search query
      let specialty =req.params.oranges
      let zipcode = req.params.apple
        db.collection('surveyAns').find({zipcode: req.body.zipcode, specialty: req.body.specialty, accountType: 'therapist'}).toArray((err, result) => {
          if (err) return console.log(err)
          res.render('search.ejs', {
            listOfTherapist: result
          })
        })
    });

// message board routes ===============================================================

    app.post('/messages', (req, res) => {
      db.collection('messages').save({name: req.body.name, msg: req.body.msg, thumbUp: 0, thumbDown:0}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/profile')
      })
    })

    app.put('/messages', (req, res) => {
      db.collection('messages')
      .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
        $set: {
          thumbUp:req.body.thumbUp + 1
        }
      }, {
        sort: {_id: -1},
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
    })

    app.delete('/messages', (req, res) => {
      db.collection('messages').findOneAndDelete({name: req.body.name, msg: req.body.msg}, (err, result) => {
        if (err) return res.send(500, err)
        res.send('Message deleted!')
      })
    })

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signupClient', function(req, res) {
            res.render('signupClient.ejs', { message: req.flash('signupMessage') });
        });

        app.get('/signupTherapist', function(req, res) {
            res.render('signupTherapist.ejs', { message: req.flash('signupMessage') });
        });
        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        app.post('/signupClient', (req, res) => {
          db.collection('surveyAns').save({accountType: 'client', question1: req.body.question1,
            name: req.body.name,
             msg: req.body.msg,}, (err, result) => {
            if (err) return console.log(err)
            console.log('saved to database')
            res.redirect('/profile')
          })
        })

        app.post('/signupTherapist', (req, res) => {
          db.collection('surveyAns').save({
            accountType: 'therapist',
            question1: req.body.question1,
            name: req.body.name,
             msg: req.body.msg,
             }, (err, result) => {
            if (err) return console.log(err)
            console.log('saved to database')
            res.redirect('/profile')
          })
        })
        // check input type, name should be the same on the route.js question1 : req.body.question1 -->
// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });



// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
}
