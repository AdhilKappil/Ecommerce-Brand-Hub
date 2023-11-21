const express = require('express'); 
const adminController = require("../controllers/adminContoller"); 
const orderController = require("../controllers/orderController"); 
const salesController = require("../controllers/reportController"); 
const couponController = require("../controllers/couponController"); 
const offerController = require("../controllers/offerController"); 
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const config = require('../config/confiq');
const auth = require('../middleware/adminAuth'); 

const fileUploadMiddleware = require('../middleware/fileUpload');


const admin_route = express();

admin_route.use(
    session({
      secret: config.sessionSecret,
      resave: false, 
      saveUninitialized:true,
  })
  );
   

// ===== setting view engine ======
admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');

admin_route.use(express.json());
admin_route.use(express.urlencoded({ extended: true }));


admin_route.use(express.static('public'))


// ============= login and log out =============
admin_route.get('/',auth.isLogout,adminController.loadLogin);
admin_route.post('/',adminController.verifyLogin);
admin_route.get('/logout',auth.isLogin,adminController.adminLogout)


// =============== dashboard'=================
admin_route.get('/dashboard',auth.isLogin,adminController.loadadHome)


// ============== categories routes ================
admin_route.get('/addCategories',auth.isLogin,adminController.loadAddCategories);
admin_route.post('/addCategories',adminController.insertCategory);
admin_route.get('/viewCategories',auth.isLogin,adminController.loadViewCategory);
admin_route.get('/unlistCategory',auth.isLogin,adminController.unlistCategory);
admin_route.get('/editCategory',auth.isLogin,adminController.loadEditCatogories);
admin_route.post('/updateCategory',adminController.editCategory);


// =============== user routes ===============
admin_route.get('/users',auth.isLogin,adminController.userLoad);
admin_route.get('/blockUsers',auth.isLogin,adminController.blockUser);


// ============== products routes ================
admin_route.get('/addProduct',auth.isLogin,adminController.loadaddProducts);
admin_route.post('/addProduct',fileUploadMiddleware.upload.array('images'), adminController.addProduct);
admin_route.get('/viewProduct',auth.isLogin,adminController.loadViewProducts);
admin_route.get('/editProduct',auth.isLogin,adminController.loadEditProduct);
admin_route.post('/editProduct',fileUploadMiddleware.upload.array('images'),adminController.editProduct)
admin_route.get('/unlistProduct',auth.isLogin,adminController.unlistProduct)


// ============== order routes ===============
admin_route.get('/order',auth.isLogin,orderController. loadAdminOrder)
admin_route.get('/order/orderManagment',auth.isLogin,orderController. orderMangeLoad )
admin_route.post('/order/orderManagment/changeStatus',auth.isLogin,orderController. changeOrderStatus )
admin_route.post('/adminCancelOrder', auth.isLogin, orderController.adminCancelOrder);
admin_route.post('/verifyPayment', auth.isLogin, orderController.verifyPayment);


// ============= sales roport routes =========
admin_route.post('/report/genarate',auth.isLogin,adminController.genarateSalesReports)
admin_route.get('/salesReport',auth.isLogin,salesController.salesReportPageLoad )
admin_route.post('/sales-report/portfolio',auth.isLogin,salesController.portfolioFiltering )
admin_route.get('/sales-report/export-report',auth.isLogin,salesController.generateExcelReportsOfAllOrders)
admin_route.get('/sales-report/export-PDF-report',auth.isLogin,salesController.generatePDFReportsOfProfit)
// admin_route.get('/orders-report/export-report',auth.isLogin,salesController.generateExcelReportsOfAllOrders)


// ================ coupon related routes ================
admin_route.get('/addCoupon',auth.isLogin,couponController.loadaddCoupon)
admin_route.post('/addCoupon',auth.isLogin,couponController.addCoupon)
admin_route.get('/coupon',auth.isLogin,couponController.loadCoupon)
admin_route.get('/editCoupon',auth.isLogin,couponController.loadEditCoupon)
admin_route.post('/editCoupon',auth.isLogin,couponController.editCoupon)
admin_route.delete('/deleteCoupon',auth.isLogin,couponController.deleteCoupon)


// ======= offer routes =========
admin_route.get('/addOffer',auth.isLogin,offerController.loadAddOffer)
admin_route.post('/addOffer',auth.isLogin,offerController.addOffer)
admin_route.get('/offer',auth.isLogin,offerController.loadOffers)
admin_route.get('/editOffer/:id',auth.isLogin,offerController.loadEditOffer)
admin_route.post('/editOffer',auth.isLogin,offerController.editOffer)
admin_route.patch('/cancelOffer',auth.isLogin,offerController.cancelOffer)


// admin_route.get('/addBaner',auth.isLogin,adminController.loadBaner)



// ========= error  page to handile =======
admin_route.get('/error-500',adminController.load500)
admin_route.get('/*',adminController.load404)





module.exports = admin_route;
