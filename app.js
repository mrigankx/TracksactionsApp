//jshint esversion: 6
require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const ejs = require("ejs");
const bodyParser = require('body-parser');
const app = express();
const router = express.Router();
const expressEjsLayout = require('express-ejs-layouts');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
require("./configs/passport")(passport);
app.use(bodyParser.urlencoded(
  { extended: "true" }
));
app.set('view engine', 'ejs');
app.use(expressEjsLayout);
app.use(express.static("public"));
const port = process.env.PORT;
mongoose.connect(process.env.MongoURL, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => console.log('connected,,'))
    .catch((err) => console.log(err));
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
    next();    
});
app.use('/',require('./routes/index'));
app.use('/users',require('./routes/users'));


app.listen(port, function () {
  console.log("Server started on port:" + port);
});



