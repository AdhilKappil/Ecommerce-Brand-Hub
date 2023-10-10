
const admin = require('../models/admin');
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


//admin login page   
const loadLogin = async(req,res)=>{

    try {
        res.render('adminLogin'); 

    } catch (error) {
        console.log(error.message); 
    }
}

//========= loading  Dashboard ========
const verifyLogin = async(req,res) => {

    try {
  
      const email = req.body.email;
      const password = req.body.password;
  
      const adminData = await admin.findOne({ email:email })
      
      if(adminData){
  
        const passwordMatch = await bcrypt.compare(password,adminData.password);
  
        if(passwordMatch){              
            res.render('dashboard');
          }else{
            res.render('adminLogin',{message:"Login details are incorrect" });
          }
  
        }else{
          res.render('adminLogin',{message:"Login details are incorrect" });
        }
  
    }catch(error){
      console.log(error);
    }
  }
  

module.exports = {
    loadLogin,
    verifyLogin
}