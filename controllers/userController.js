// const User = require('../models/userModel');
const bcrypt = require("bcrypt");

//user login   
const loginLoad = async(req,res)=>{

    try {
        res.render('login'); 

    } catch (error) {
        console.log(error.message); 
    }
}


module.exports = {
    loginLoad 
};