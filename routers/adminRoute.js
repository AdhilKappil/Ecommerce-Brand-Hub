const express = require('express'); 
const adminController = require("../controllers/adminContoller"); 
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



admin_route.get('/',auth.isLogout,adminController.loadLogin);

admin_route.post('/',adminController.verifyLogin);

admin_route.get('/dashboard',auth.isLogin,adminController.loadadHome)

admin_route.get('/addCategories',auth.isLogin,adminController.loadAddCategories);

admin_route.post('/addCategories',adminController.insertCategory);

admin_route.get('/viewCategories',auth.isLogin,adminController.loadViewCategory);

admin_route.get('/unlistCategory',auth.isLogin,adminController.unlistCategory);

admin_route.get('/editCategory',auth.isLogin,adminController.loadEditCatogories);

admin_route.post('/updateCategory',adminController.editCategory);

admin_route.get('/users',auth.isLogin,adminController.userLoad);

admin_route.get('/blockUsers',auth.isLogin,adminController.blockUser);

admin_route.get('/addProduct',auth.isLogin,adminController.loadaddProducts);

admin_route.post('/addProduct', upload.array('images'), adminController.addProduct);

admin_route.get('/viewProduct',auth.isLogin,adminController.loadViewProducts);

admin_route.get('/editProduct',auth.isLogin,adminController.loadeditProduct);

admin_route.post('/editProduct',upload.single('image'),adminController.editProduct)

admin_route.get('/unlistProduct',auth.isLogin,adminController.unlistProduct)

admin_route.get('/logout',auth.isLogin,adminController.adminLogout)

// admin_route.get('/addBaner',auth.isLogin,adminController.loadBaner)




module.exports = admin_route;
