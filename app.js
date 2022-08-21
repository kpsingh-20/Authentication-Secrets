require('dotenv').config()
const express = require("express");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ejs = require("ejs");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

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
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());           // serealize and deserialize only for express sessions for cookies.
passport.deserializeUser(User.deserializeUser());


app.get("/", function(req, res){
    res.render("home");
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
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
})

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
