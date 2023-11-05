const express = require('express'); 
const adminController = require("../controllers/adminContoller"); 
const orderController = require("../controllers/orderController"); 
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const config = require('../config/confiq');
const auth = require('../middleware/adminAuth'); 




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

const storage = multer.diskStorage({
  destination:function(req,file,cb){
    cb(null,path.join(__dirname,'../public/adminAssets/images/products'));
  },
  filename:function(req,file,cb) {
    const name = Date.now()+'-'+file.originalname;
    cb(null,name)
  }
})

const upload = multer({storage:storage});



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
admin_route.post('/addProduct', upload.array('images'), adminController.addProduct);
admin_route.get('/viewProduct',auth.isLogin,adminController.loadViewProducts);
admin_route.get('/editProduct',auth.isLogin,adminController.loadEditProduct);
admin_route.post('/editProduct',upload.array('images'),adminController.editProduct)
admin_route.get('/unlistProduct',auth.isLogin,adminController.unlistProduct)


// ============== order routes ===============
admin_route.get('/order',auth.isLogin,orderController. loadAdminOrder)
admin_route.get('/order/orderManagment',auth.isLogin,orderController. orderMangeLoad )
admin_route.post('/order/orderManagment/changeStatus',auth.isLogin,orderController. changeOrderStatus )


// admin_route.get('/addBaner',auth.isLogin,adminController.loadBaner)








// ========= error  page to handile=======
admin_route.get('/error-500',adminController.load500)
admin_route.get('/*',adminController.load404)





module.exports = admin_route;
