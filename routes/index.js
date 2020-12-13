//jshint esversion: 6
const express = require('express');
const router = express.Router();
const UserData = require("../models/userdata.js");
const { ensureAuthenticated } = require('../configs/auth.js');
//login page
let user = "";
let userdata = [];
let totalSpent = 0;
let max_bal = 0;
let max_trans = 0;
let bal_left = 0;
let overbudget = 0;
let overbudgetString = "No";
let date = new Date();
date = date.toLocaleDateString("en-US");
router.get('/', (req, res) => {
    res.render('Login');
});
//register page
router.get("/home", (req, res) => {
    user = req.user;
    UserData.aggregate([
        {
            $match:
                { username: user.email }
        }, 
        {
            $group: {
                _id: "$username",
                totalAmount: { $sum: "$amount" },
                max_trans: { $max: "$amount" },
                max_bal: { $first: '$max_balance' },
                overbudget: { $first: '$overbudgetAmount'}
            }
        }
           ]).then((res) => {
        // res.forEach(item => {
            // if (item._id === user.email) {
                // totalSpent = item.totalAmount;
                // max_trans = item.max_trans;
                // console.log("\nfound match: "+ user.email);
            // }
        // });
        max_bal = res[0].max_bal;
        totalSpent = res[0].totalAmount;
               max_trans = res[0].max_trans;
               overbudget = res[0].overbudget;
        bal_left = Number(max_bal - totalSpent);
        if (bal_left <= 0)
        {   
            overbudget = Math.abs(bal_left);
            overbudgetString = "Yes(₹"+overbudget+")";
            bal_left = 0;
        }
        
    });
    UserData.find(
        {
            username: user.email
        }
    ).then((res) => {
        userdata = res;
    });
    res.redirect("/dashboard");
    
});

router.get('/register', (req, res) => {
    res.render('Register');
});
router.get("/dashboard", ensureAuthenticated, (req, res) => {
    let calculatedData = {
        totalSpent: totalSpent,
        today: date,
        bal_left: bal_left,
        max_trans: max_trans,
        overbudget: overbudgetString
    };
    res.render('Dashboard', {
        user: user,
        userdata: userdata,
        calculatedData: calculatedData
    });
    
});

router.post("/addnew", (req, res) => {
    let uname = user.email;
    let today = date;
    let spent_on = req.body.spent_on;
    let amnt = req.body.spent_amnt;
    let spent_cate = req.body.spent_cate;
    total = +totalSpent + +amnt;
    const newentry = new UserData({
        username : uname,
        entrydate: today,
        spent_category: spent_cate,
        spent_on :spent_on,
        amount: amnt,
        total: total,
        overbudgetAmount: overbudget
    });
    newentry.save().then((value) => {
        req.flash("success_msg", "Transaction added successfully.");
    }).catch(value => console.log(value));
    bal_left = Number(max_bal - total);
    res.redirect('/home');
});

module.exports = router; 