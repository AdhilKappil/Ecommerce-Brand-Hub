const express = require('express'); 
const path = require("path");
const userController = require("../controllers/userController"); 
const cartController = require("../controllers/cartController"); 
const profileController = require("../controllers/profileController"); 
const orderController = require("../controllers/orderController"); 
const walletController = require("../controllers/walletController");
const couponController = require("../controllers/couponController"); 
const cartLength = require("../middleware/cartMiddleware");
const session = require('express-session'); 
const config = require('../config/confiq');
const auth = require('../middleware/userAuth'); 
const errorHandler =require('../middleware/errorHandler')


const user_route = express();

user_route.use(
    session({
      secret: config.sessionSecret,
      resave: false, 
      saveUninitialized:true,
  })
  );
  user_route.use(cartLength)

user_route.set('view engine','ejs');
user_route.set('views','./views/users');

user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));


// =========== home page =============
user_route.get('/',userController. loadHome);
user_route.get('/home',userController. loadHome);


// ========== login, register, log out ===========
user_route.post('/login',userController. verifLoadHome);
user_route.get('/login',auth.isLogout,userController. loginLoad);
user_route.get('/register',userController.loadRegister);
user_route.get('/logout',auth.isLogin,userController.userLogout)


// =============== otp routes ============
user_route.post('/register',userController.verifyOtp);
user_route.get('/userOtp',userController.loadOtpPage);
user_route.post('/userOtp',userController.insertUser);
user_route.get('/resendOtp', userController.resendOtp); 


// =============== forgot password routes ===============
user_route.get('/forgotPassword', userController.loadForgotPassword); 
user_route.post('/forgotPassword', userController.forgotVerify); 
user_route.get('/changePassword', userController.loadChangePassword);
user_route.post('/changePassword', userController.updatePassword); 


// =============== product routes ==============
user_route.get('/products', userController.loadProducts);
user_route.get('/productDetails', userController.loadProductDetails);


// ============= cart routes =================
user_route.get('/viewCart',auth.isLogin,cartController.loadCart);
user_route.post('/addToCart',cartController.addToCart);
user_route.delete('/removeCart',cartController.removeCart);
user_route.post('/updateCart',cartController.updateCart);
user_route.get('/get-max-stock/:id', auth.isLogin, cartController.getMaxStock);


// ================ user profile routes ================
user_route.get('/userProfile',auth.isLogin,profileController.loadProfile);
user_route.get('/address',auth.isLogin,profileController.loadAddress);
user_route.post('/addAddress',auth.isLogin,profileController.addAddress);
user_route.get('/editAddress',auth.isLogin,profileController.loadEditAddress);
user_route.post('/editAddress',auth.isLogin,profileController.editAddress);
user_route.delete('/deleteAddress',profileController.deleteAddress);
user_route.post('/updateUser',auth.isLogin,profileController.updateUser);
user_route.post('/resetPassword',auth.isLogin,profileController.resetPassword);
user_route.get('/coupon',auth.isLogin,profileController.loadCoupon);


// ============== order page routes ===============
user_route.get('/checkout',auth.isLogin,orderController.loadCheckout);
user_route.post('/addShippingAddress',auth.isLogin,orderController.addShippingAddress);
user_route.post('/placeOrder',auth.isLogin,orderController.placeOrder);
user_route.get('/viewOrder',auth.isLogin,orderController.loadOrderPage);
user_route.get('/orderDetails',auth.isLogin,orderController.loadOrderDetailes);
user_route.post('/cancelOrder',auth.isLogin,orderController.cancelOrder);
user_route.post('/verifyPayment',auth.isLogin,orderController.verifyPayment);
user_route.get('/downloadInvoic',auth.isLogin,orderController.invoiceDownload);


// ========= wallet routes ==========
user_route.get('/wallet',auth.isLogin,walletController.loadWallet);
user_route.post('/addMoneyToWallet',auth.isLogin,walletController.addMoneyToWallet);
user_route.post('/verifyWalletpayment',auth.isLogin,walletController.verifyWalletPayment);


// ========= coupon routes ==========
user_route.post('/applyCoupon',auth.isLogin,couponController.couponCheck);
user_route.post('/removeCoupon',auth.isLogin,couponController.removeCoupon);


// ========= error  page to handile=======
user_route.use(errorHandler); 



module.exports = user_route; 