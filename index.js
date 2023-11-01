require('dotenv').config();
const mongoose = require("mongoose");
const path = require("path")
mongoose.connect(process.env.mongoose)
const express = require("express");

const app = express();

app.use("/static", express.static(path.join(__dirname, "public")));

// app.set('view engine','ejs');
// app.set('views','./views/errorPage');

// ========== cache contoling =========
const disable = (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '1');
    next(); 
  }
  app.use(disable);


//user Route
const userRoute = require('./routers/userRoute');
app.use('/',userRoute);
 
// Admin Route
const adminRoute = require('./routers/adminRoute');
app.use('/admin',adminRoute);
    
 
 
 
// ========= 404 page to handile cache =======
//   app.use('*',(req,res)=>{
//     res.send('404')
// })

app.listen(process.env.port,()=>{
    console.log("Server is running...");
})