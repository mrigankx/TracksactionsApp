//jshint esversion: 6
const express = require('express');
const router = express.Router();
const UserData = require("../models/userdata.js");
const { ensureAuthenticated } = require('../configs/auth.js');
const nodemailer = require('nodemailer');
//login page
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
//register page
router.get("/home", (req, res) => {
    user = req.user;
    max_bal = user.max_balance;
    console.log("Max Balance: "+max_bal);
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
                    
                },
                totalAmount: { $sum: "$amount" },
                max_trans: { $max: "$amount" },
            }
        }
    ]).then((res) => {
        // console.log(res);
        res.forEach(item => {
        // console.log("\nMonth got from arr: "+item._id.month+"| Month from today: "+thismonth+"\n Year got from arr: "+item._id.year+"| Year from today: "+thisyear);
        });
        res.forEach(item => {
            if (item._id.month === thismonth && item._id.year === thisyear)
            {
                console.log("Found match:"+item);
                totalSpent = item.totalAmount;
                max_trans = item.max_trans;
            }
          
           
        });
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
    { console.log("sending an email alert");
        transporter.sendMail(mailOptions, function(error, info){
        if (error) {
        console.log(error);
        } else {
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
    req.flash("sucess_msg", "Now logged out");
    res.redirect("/");
});
module.exports = router; 