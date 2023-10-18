const mongoose = require("mongoose");
const path = require("path")
mongoose.connect("mongodb://127.0.0.1:27017/Brand-Hub")
const express = require("express");

const app = express();

app.use("/static", express.static(path.join(__dirname, "public")));


//user Route
const userRoute = require('./routers/userRoute');
app.use('/',userRoute);
 
 
 
// Admin Route
const adminRoute = require('./routers/adminRoute');
app.use('/admin',adminRoute);
   

app.listen(3000,()=>{
    console.log("Server is running...");
})