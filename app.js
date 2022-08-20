require('dotenv').config()
const express = require("express");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ejs = require("ejs");
const encrypt = require('mongoose-encryption');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/userDB');

var userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res){
    res.render("home");
});

app.route("/login")
.get( function(req, res){
    res.render("login");
})
.post(function(req, res){

    const username= req.body.username;
    const password = (req.body.password);

    User.findOne({email : username}, function(err, found){
        if(err){
            console.log(err);
        }else{
            if(found){
                bcrypt.compare(password, found.password, function(err, result) {
                    // result == true
                    if(result === true){
                        res.render("secrets");
                    }else{
                        res.send("Password is incorrect.");
                    }
                });
            }else{
                res.send("User not found.");
            }
        }
    })
});

app.route("/register")
.get( function(req, res){
    res.render("register");
})
.post(function(req, res){

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const user = new User({
            email : req.body.username,
            password : hash
        });

        user.save(function(err){
            if(err){
                console.log(err);
            }else{
                res.render("secrets");
            }
        })
    });


});

















app.listen(3000, function(){
    console.log("server started on PORT 3000");
});
