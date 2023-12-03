require('dotenv').config();
const mongoose = require("mongoose");
const path = require("path")
const express = require("express");
const userRoute = require('./routers/userRoute');
const adminRoute = require('./routers/adminRoute');

mongoose.connect(process.env.mongoose).then(()=>{
  console.log('database connected');
}) 

const app = express(); 


// ========== setting public folder =======
app.use("/static", express.static(path.join(__dirname, "public"))); 


// ======= setting view engine ======= 
app.set('view engine','ejs');
app.set('views','./views/users');


// ========== cache contoling =========
const disable = (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '1');
    next(); 
  }
  app.use(disable);


//user Route
app.use('/',userRoute);
 
// Admin Route
app.use('/admin',adminRoute);
    
 
// ========= 404 page to handile cache =======
  app.use('*',(req,res)=>{
    res.render('404-error')
})


// ========= port setup ========
app.listen(process.env.port,()=>{
    console.log("Server is running...");
})