const bcrypt = require("bcrypt");
// const nodemailer = require("nodemailer")
// const randomstring = require('randomstring')
// const path = require("path")
// const otpGenerator = require("otp-generator")
// const Product = require('../models/product');
// const Category = require('../models/category');
const User = require('../models/users');
const Address = require('../models/userAddress');
const { ObjectId}=require('mongodb')




// ========== pasword security ==========
// const securePassword = async(password)=>{

//     try {
        
//         const passwordHash = await bcrypt.hash(password,10);
//         return passwordHash;

//     } catch (error) {
//         console.log(error.message);
//     }
// }



// ========== rendering user profile ===========
const loadProfile = async (req,res)=>{
    try{
  
      const id = req.session.user_id
      const userData = await  User.findById({_id:id})
      const userAddress = await Address.findOne({ userId: id })
    
      res.render('profile',{user:userData,address: userAddress})
  
    }catch(error){
      console.log(error);
    }
  }


 
// ========= rendering user address page ==========  
const loadAddress = async(req,res)=>{
    try{
  
      const userId = req.session.user_id
          
      res.render('address',{user:userId})
  
    }catch(error){
      console.log(error);
    }
  
}  
 

  

// =========== adding user address =========
const addAddress = async(req,res)=>{
  try {
    
    let userAddress = await Address.findOne({ userId: req.session.user_id });
    if (!userAddress) {
      userAddress = new Address({
        userId: req.session.user_id,
        address: [
          {
                fullName: req.body.fullName,
                mobile: req.body.mobile,
                state: req.body.state,
                district: req.body.district,
                city: req.body.city,
                pincode: req.body.pincode,
          },
        ],
      });
    } else {
      
      userAddress.address.push({
                fullName: req.body.fullName,
                mobile: req.body.mobile,
                state: req.body.state,
                district: req.body.district,
                city: req.body.city,
                pincode: req.body.pincode,
      });
    }

    
    let result = await userAddress.save();
    
    
    res.redirect('/userProfile');
  } catch (error) {
    console.log(error.message);
  }
};



// ========== here user cand edit address =======
const loadEditAddress = async(req,res)=>{
    try{

      const id = req.query.id
      const userId = req.session.user_id
  
      let userAddress = await Address.findOne({ userId: userId  },{address:{$elemMatch:{_id:id}}})
  
      const address= userAddress.address
  
      res.render('editAddress',{user:userId,addresses:address[0]})
  
      
    }catch(error){
      console.log(error);
    }
}


 
// ========== edit user address ==========
const editAddress =async (req,res)=>{
    try {
         const user_id=req.session.user_id
         const addressId=req.body.id
         
         const details = await Address.updateOne(
            { userId:user_id, "address._id": addressId },
            {
              $set: {
                "address.$.fullName": req.body.fullName,
                "address.$.pincode": req.body.pincode,
                "address.$.city": req.body.city,
                "address.$.mobile": req.body.mobile,
                "address.$.state": req.body.state,
                "address.$.district": req.body.district,
              },
            }
          );
         res.redirect('/userProfile')

    } catch (error) {
      console.log(error);
    }
}



// ============ deleting user address =========
const deleteAddress = async (req, res) => {
    try {
    
      let userAddress = await Address.findOne({ userId: req.session.user_id });
      const addressToDeleteIndex = userAddress.address.findIndex(
        (address) => address.id === req.body.id
      );
      if (addressToDeleteIndex === -1) {
        return res.status(404).json({ remove: 0 });
      }
      userAddress.address.splice(addressToDeleteIndex, 1);
      await userAddress.save();
      return res.json({ remove: 1 });
    } catch (error) {
      console.log(error.message);
    }
};



// ======== updating user detailesl =========
const updateUser =async (req,res)=>{
    try {

         const user_id=req.session.user_id
         
         const details = await User.updateOne(
            { _id:user_id },
            {
              $set: {
                firstName: req.body.Fname,
                lastName: req.body.Lname,
                email: req.body.email,
                mobile: req.body.mobile,
              },
            },
            {
                new:true
            }
          );
        
         res.redirect('/userProfile')

    } catch (error) {
      console.log(error);
    }
}



// ======== updating user detailesl =========
const resetPassword =async (req,res)=>{

  try {
    const userDetails = await User.findOne({_id:req.session.user_id})

    bcrypt.compare(req.body.oldPassword,userDetails.password)
    .then(async (status)=>{
      if(status){
        const newSecurePassword = await bcrypt.hash(req.body.newPassword, 10);

          const change = await User.updateOne(
            { _id: userDetails._id },
            { $set: { password: newSecurePassword } }
          );
          console.log(change);
          res.redirect("/userProfile");
          console.log("password changed...");
        } else {
          console.log("wrong old password");
          res.redirect("/userProfile");
        }
      
    })
  } catch (error) {
    console.log(error);
}
}




module.exports = {
   
    loadProfile,
    loadAddress,
    addAddress,
    loadEditAddress,
    editAddress,
    deleteAddress,
    updateUser,
    resetPassword
    
};