require('dotenv').config()
const express = require("express");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ejs = require("ejs");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'This is my secret key',
  resave: false,
  saveUninitialized: false,
  // cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB');

var userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId : String,
    secret : String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
      // console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
    res.render("home");
});


app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));

  app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect to secrets.
      res.redirect('/secrets');
    });

app.get("/logout", function(req, res){
    req.logout(function(err) {
      if (err) {
          console.log(err);
      }else
            res.redirect('/');
    });
})


app.route("/register")
.get( function(req, res){
    res.render("register");
})
.post(function(req, res){

    User.register({username:req.body.username} , req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        }else{
            // const authenticate = User.authenticate();
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            })
        };
    });
});

app.get("/secrets", function(req, res){
    // res.render("secrets", {})

    User.find({"secret" : {$ne : null}}, function(err, foundUser){
        if(!err){
            if(foundUser){
                res.render("secrets", {UserWithSecrets  : foundUser})
            }
        }else{
            console.log(err);
            res.send(err);
        }
    })
});

app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});
app.post("/submit", function(req, res){
    const submittedContent = req.body.secret;

    // console.log(req.user);

    User.findById(req.user.id, function(err, foundUser){
        if(err){
            console.log(err);
            res.send(err);
        }else{
            if(foundUser){
                foundUser.secret = submittedContent;
                foundUser.save(function(){
                    res.redirect("secrets");
                })
            };
        }
    });

});

app.route("/login")
.get( function(req, res){
    res.render("login");
})
.post(function(req, res){
    const user = new User({
        username : req.body.username,
        password : req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
            res.redirect("/login");
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        };
    })

});



















app.listen(3000, function(){
    console.log("server started on PORT 3000");
});
