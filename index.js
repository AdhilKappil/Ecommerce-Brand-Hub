const mongoose = require("mongoose");
const path = require("path")
mongoose.connect("mongodb://127.0.0.1:27017/Brand-Hub")
const express = require("express");

const app = express();

app.use("/static", express.static(path.join(__dirname, "public")));

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
  app.use('*',(req,res)=>{
    res.send('404')
})

app.listen(3000,()=>{
    console.log("Server is running...");
})