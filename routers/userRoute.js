const express = require('express'); 
const path = require("path");
const userController = require("../controllers/userController"); 
// const session = require('express-session');
// const config = require('../config/config');
// const auth = require('../middleware/auth'); 


const user_route = express();

// user_route.use(
//     session({
//       secret: config.sessionSecret,
//       resave: false, 
//       saveUninitialized:true,
//   })
//   );


user_route.set('view engine','ejs');
user_route.set('views','./views/users');

user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));


user_route.get('/',userController. loginLoad);
user_route.get('/login',userController. loginLoad);

user_route.get('/register',userController.loadRegister);

user_route.post('/register',userController.insertUser)



module.exports = user_route; 