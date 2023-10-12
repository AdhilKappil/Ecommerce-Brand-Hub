const express = require('express'); 
const adminController = require("../controllers/adminContoller"); 
// const session = require('express-session');
// const config = require('../config/config');
// const auth = require('../middleware/adminAuth'); 




const admin_route = express();

// admin_route.use(
//     session({
//       secret: config.sessionSecret,
//       resave: false, 
//       saveUninitialized:true,
//   })
//   );
   

// ===== setting view engine ======
admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');

admin_route.use(express.json());
admin_route.use(express.urlencoded({ extended: true }));

// ====== to add images ======
const multer = require('multer');
const path = require('path');

admin_route.use(express.static('public'))

const storage = multer.diskStorage({
  destination:function(req,file,cb){
    cb(null,path.join(__dirname,'../public/adminAssets/images'));
  },
  filename:function(req,file,cb) {
    const name = Date.now()+'-'+file.originalname;
    cb(null,name)
  }
})

const upload = multer({storage:storage});



admin_route.get('/',adminController.loadLogin);

admin_route.post('/',adminController.verifyLogin);

admin_route.get('/addCategories',adminController.loadAddCategories);

admin_route.post('/addCategories',adminController.insertCategory);

admin_route.get('/viewCategories',adminController.loadViewCategory);

admin_route.get('/unlistCategory',adminController.unlistCategory);

admin_route.get('/editCategory',adminController.loadEditCatogories);

admin_route.post('/updateCategory',adminController.editCategory);

admin_route.get('/users',adminController.userLoad);

admin_route.get('/blockUsers',adminController.blockUser);

admin_route.get('/blockUsers',adminController.blockUser);

admin_route.post('/addProduct',adminController.addProduct);










module.exports = admin_route;
