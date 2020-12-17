//jshint esversion: 6
const express = require('express');
const router = express.Router();
const UserData = require("../models/userdata.js");
const { ensureAuthenticated } = require('../configs/auth.js');
const nodemailer = require('nodemailer');
let amounts = {
        Food: 0,
        Travel: 0,
        Books: 0,
        Drinks: 0,
        Grocery: 0,
        Others: 0,
    };
let bardata = {
    "month1": 0,
    "month2": 0,
    "month3": 0,
    "month4": 0,
    "month5": 0,
    "month6": 0,
    "month7": 0,
    "month8": 0,
    "month9": 0,
    "month10": 0,
    "month11": 0,
    "month12": 0
};
let user = "";
let userdata = [];
let totalSpent = 0;
let max_bal = 0;
let max_trans = 0;
let bal_left = 0;
let overbudget = 0;
let overbudgetString = "No";
let todaydate = new Date(); 
let thismonth = todaydate.getMonth() + 1;
let thisyear = todaydate.getFullYear();
let date = todaydate.toLocaleDateString("en-US");
const emailuser = {
    id: 'tracksactionsapp@gmail.com',
    pass: 'tracksactions@901'
};
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailuser.id,
    pass: emailuser.pass
  }
});
router.get('/', (req, res) => {
    res.render('Login');
});
router.get("/home", (req, res) => {
    user = req.user;
    max_bal = user.max_balance;
    UserData.aggregate([
        {
            $match:
            {
                username: user.email
            }
        }, 
        {
            $group: {
                _id: {
                    month: { $month: "$entrydate" },
                    year: { $year: "$entrydate" },
                    // categories: "$spent_category"
                },
                totalAmount: { $sum: "$amount" },
                max_trans: { $max: "$amount" },
            }
        }
    ]).then((res) => {
        res.forEach(item => {
            if (item._id.month === thismonth && item._id.year === thisyear)
            {
                totalSpent = item.totalAmount;
                max_trans = item.max_trans;
            }
            if (item._id.year === thisyear) {
                bardata["month" + item._id.month] = item.totalAmount;
            }
        });
            bal_left = Number(max_bal - totalSpent);
            if (bal_left <= 0)
            {   
            overbudget = Math.abs(bal_left);
            overbudgetString = "₹"+overbudget;
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
router.get("/dashboard", ensureAuthenticated, (req, resp) => {
    UserData.aggregate([
        {
            $match:
            {
                username: user.email
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$entrydate" },
                    month: { $month: "$entrydate" },
                    categories: "$spent_category"
                },
                totalAmount: { $sum: "$amount" }
            }
        }
    ]).then((res) => {
        res.forEach(item => {
            if (item._id.month === thismonth && item._id.year === thisyear && item._id.categories!= "Opening acount") {
                let percent = (item.totalAmount / totalSpent) * 100;
                for (var key of Object.keys(amounts)) {
                    if (key === item._id.categories) {
                        amounts[key] = percent;
                    }
                }
            }
        });
    let calculatedData = {
        totalSpent: totalSpent,
        today: date,
        bal_left: bal_left,
        max_trans: max_trans,
        overbudget: overbudgetString,
        chartData: amounts,
        bardata: bardata
    };
    resp.render('Dashboard', {
        user: user,
        userdata: userdata,
        calculatedData: calculatedData
    });
    
    });
     
});

router.post("/addnew", (req, res) => {
    let uname = user.email;
    let spent_on = req.body.spent_on;
    let amnt = req.body.spent_amnt;
    let spent_cate = req.body.spent_cate;
    total = +totalSpent + +amnt;
    const newentry = new UserData({
        username : uname,
        entrydate: todaydate,
        spent_category: spent_cate,
        spent_on :spent_on,
        amount: amnt,
        total: total,
        overbudgetAmount: overbudget
    });
    const mailOptions = {
        from: 'tracksactionsapp@gmail.com',
        to: uname,
        subject: 'Warning! You are going overbudget.',
        text: "Hi, "+user.name+"! This an automated mail from Tracksactions App. You are going over budget,please check your expenses."
    };
    if (total > max_bal)
    { 
        transporter.sendMail(mailOptions, function(error, info){
        if (error) {
        }
        else {
        console.log('Email sent: ' + info.response);
        }
        });
        }
        
    newentry.save().then((value) => {
        req.flash("success_msg", "Transaction added successfully.");
    }).catch(value => console.log(value));
    bal_left = Number(max_bal - total);
    res.redirect('/home');
});
router.get('/logout', (req, res) => {
    req.logout();
    overbudget = 0;
    overbudgetString = "No";
    amounts = {
        Food: 0,
        Travel: 0,
        Books: 0,
        Drinks: 0,
        Grocery: 0,
        Others: 0,
    };
    bardata = {
    "month1": 0,
    "month2": 0,
    "month3": 0,
    "month4": 0,
    "month5": 0,
    "month6": 0,
    "month7": 0,
    "month8": 0,
    "month9": 0,
    "month10": 0,
    "month11": 0,
    "month12": 0
};
    req.flash("sucess_msg", "Now logged out");
    res.redirect("/users/login");
});
module.exports = router; 