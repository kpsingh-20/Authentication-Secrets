const express = require("express");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ejs = require("ejs");



const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/wikiDB");

app.listen(3000, function(){
    console.log("server started on PORT 3000");
});
