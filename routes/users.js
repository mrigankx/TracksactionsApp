//jshint esversion: 6
const express = require('express');
const router = express.Router();
const User = require("../models/user.js");
const UserData = require("../models/userdata.js");
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const passport = require('passport');
router.use(bodyParser.urlencoded(
  { extended: "true" }
));
//login handle
router.get('/login', (req, res) => {
    res.render('Login');
});
router.get('/register', (req, res) => {
    res.render('Register');
});
//Register handle
router.post('/register', (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const password2 = req.body.password2;
    const max_balance = req.body.max_bal;
    let errors = [];
    if (!name || !email || !password || !password2) {
        errors.push({ msg: "Please fill in all fields" });
    }
    //check if match
    if (password !== password2) {
        errors.push({ msg: "Passwords don't match" });
    }

    //check if password is more than 6 characters
    if (password.length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters' });
    }
    if (errors.length > 0) {
        res.render('Register', {
            errors: errors,
            name: name,
            email: email,
            password: password,
            password2: password2
        });
    } else {
        //validation passed
        User.findOne({ email: email }).exec((err, user) => {
            if (user) {
                errors.push({ msg: 'Email already registered' });
                // res.render(res, errors, name, email, password, password2);
                res.render('Register', {
                    errors: errors,
                    name: name,
                    email: email,
                    password: password,
                    password2: password2
                });
        
            } else {
                const newUser = new User({
                    name: name,
                    email: email,
                    password: password,
                    max_balance: max_balance
                });
                //hash password
                bcrypt.genSalt(10, (err, salt) =>
                    bcrypt.hash(newUser.password, salt,
                        (err, hash) => {
                            if (err) throw err;
                            //save pass to hash
                            newUser.password = hash;
                            //save user
                            newUser.save()
                                .then((value) => {
                                    req.flash("success_msg", "You have now registered successfully");
                                    res.redirect('/users/login');
                                })
                                .catch(value => console.log(value));
                      
                        }));
                const newData = new UserData({
                    username : email,
                    spent_category: "Opening account",
                    amount: 0,
                    total: 0,
                    overbudgetAmount: 0,
                });
                newData.save();
            } //ELSE statement ends here
        });
    }
});
router.post('/login', (req, res, next) => {
    passport.authenticate("local", {
        successRedirect: "/home",
        failureRedirect: "/users/login",
        failureFlash: true,
    })(req, res, next);
});
router.get("/resetpassword", (req, res) => {
    res.render("ResetPassword");
});
router.post("/resetpassword", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const password2 = req.body.password2;
    let errors = [];
    if (password !== password2) {
        errors.push({ msg: "Passwords don't match" });
    }
    //check if password is more than 6 characters
    if (password.length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters' });
    }
    if (errors.length > 0) {
        res.render('ResetPassword', {
            errors: errors,
            email: email,
            password: password,
            password2: password2
        });
    } 
    else {
        //validation passed
        User.findOne({ email: email }).exec((err, user) => {
            if (user) {
                bcrypt.genSalt(10, (err, salt) =>
                    bcrypt.hash(password, salt,
                        (err, hash) => {
                            if (err) throw err;
                            //save pass to hash
                            User.updateOne(
                                {
                                     email: email
                                },
                                {
                                     $set : {password: hash}
                                }
                            ).then((value) => {
                                    req.flash("success_msg", "Password changed successfully");
                                    res.redirect('/users/login');
                                })
                                .catch(value => console.log(value));
                      
                        }));
            } else {
                
                
            }
        });
    }
});
module.exports  = router;