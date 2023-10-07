
const User = require('../models/usersModels/users');
const bcrypt = require("bcrypt");


//pasword security
const securePassword = async(password)=>{

    try {
        
        const passwordHash = await bcrypt.hash(password,10);
        return passwordHash;

    } catch (error) {
        console.log(error.message);
    }
}


//user login   
const loginLoad = async(req,res)=>{

    try {
        res.render('login'); 

    } catch (error) {
        console.log(error.message); 
    }
}

//user registraion
const loadRegister = async(req,res)=>{
    try {
        res.render('registration');

    } catch (error) {
       console.log(error.message); 
    }
}

//insert user collection
const insertUser = async(req,res)=>{

    try {
        const spassword = await securePassword(req.body.password)
        const user = new User({
            firstName:req.body.Fname,
            lastName:req.body.Lname,
            email:req.body.email,
            mobile:req.body.mobile,
            password:spassword,
           
        })

        const userData = await user.save();

        if(userData){
            
            res.render('login',{message:"Your registration is successfull", clr:'text-success'})
        }else{ 
            res.render('registration',{message:"Your registration is failed"})
        }
    } catch (error) {
        console.log(error.message); 
    }
}


module.exports = {
    loginLoad ,
    loadRegister,
    insertUser,
    
};