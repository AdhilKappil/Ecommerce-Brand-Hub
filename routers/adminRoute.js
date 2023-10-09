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
   

admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');

admin_route.use(express.json());
admin_route.use(express.urlencoded({ extended: true }));

admin_route.get('/',adminController.loadLogin);

admin_route.get('/login',adminController.loadLogin);

// admin_route.post('/login',adminController.verifyLogin);


module.exports = admin_route;
