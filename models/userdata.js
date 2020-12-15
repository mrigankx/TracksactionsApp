//jshint esversion: 6
const mongoose = require('mongoose');
const userDataSchema  = new mongoose.Schema({
    username :{
        type  : String,
  } ,
    entrydate :{
        type: Date,
        default: Date.now
} , spent_category :{
        type  : String,
} ,
    spent_on :{
        type  : String,
        required : false
} ,
    amount: {
        type: Number,
        default: 0
    }, 
    total: {
        type: Number,
        required: false,
        default: 0
    },
    max_balance: {
        type: Number,
        required: false
    },
    overbudgetAmount: {
        type: Number
    }

});
const UserData= mongoose.model('Userdata',userDataSchema);
module.exports = UserData;