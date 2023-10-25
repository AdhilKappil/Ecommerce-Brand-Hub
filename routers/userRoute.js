const express = require('express'); 
const path = require("path");
const userController = require("../controllers/userController"); 
const cartController = require("../controllers/cartController"); 
const session = require('express-session'); 
const config = require('../config/confiq');
const auth = require('../middleware/userAuth'); 


const user_route = express();

user_route.use(
    session({
      secret: config.sessionSecret,
      resave: false, 
      saveUninitialized:true,
  })
  );


user_route.set('view engine','ejs');
user_route.set('views','./views/users');

user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));

user_route.get('/',userController. loadHome);
user_route.get('/home',userController. loadHome);

user_route.post('/login',userController. verifLoadHome);

user_route.get('/login',auth.isLogout,userController. loginLoad);

user_route.get('/register',userController.loadRegister);

user_route.post('/register',userController.verifyOtp);

user_route.get('/userOtp',userController.loadOtpPage);

user_route.post('/userOtp',userController.insertUser);

user_route.get('/resendOtp', userController.resendOtp); 

user_route.get('/forgotPassword', userController.loadForgotPassword); 

user_route.post('/forgotPassword', userController.forgotVerify); 

user_route.get('/changePassword', userController.loadChangePassword);

user_route.post('/changePassword', userController.updatePassword); 

user_route.get('/products', userController.loadProducts);

user_route.get('/productDetails', userController.loadProductDetails);

user_route.get('/logout',auth.isLogin,userController.userLogout)

user_route.get('/searchProduct', userController.searchProducts);

user_route.get('/viewCart',auth.isLogin,cartController.loadCart);

user_route.post('/addToCart',cartController.addToCart);

user_route.delete('/removeCart',cartController.removeCart);

module.exports = user_route; 