
const User = require('../models/users');
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer")



//pasword security
const securePassword = async(password)=>{

    try {
        
        const passwordHash = await bcrypt.hash(password,10);
        return passwordHash;

    } catch (error) {
        console.log(error.message);
    }
}



//user login   
const loginLoad = async(req,res)=>{

    try {
        res.render('login'); 

    } catch (error) {
        console.log(error.message); 
    }
}

const loadHome = async(req,res)=>{

    try {
        res.render('home'); 

    } catch (error) {
        console.log(error.message); 
    }
}


//user registraion
const loadRegister = async(req,res)=>{
    try {
        res.render('registration');

    } catch (error) {
       console.log(error.message); 
    }
}

//otp genarating
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};


const sendVerificationEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: 'adhilaliotheruse@gmail.com',
                pass: 'xkmc oady uruw zkkq',
            },
        });

        const mailOptions = {
            from: 'adhilaliotheruse@gmail.com',
            to: email,
            subject: 'Verify Your Email',
            html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
        };
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.log(error);
    }
}





//user otp
const loadOtpPage = async(req,res)=>{
    try {
        res.redirect('/userOtp');

    } catch (error) {
       console.log(error.message); 
    }
}

//ottp verification and otp storing in session
const verifyOtp = async(req,res)=>{

    try {

           // setting otp date and time
           const otpCode = generateOTP();
           const creationTime = Date.now()/1000;
           const expirationTime = creationTime + 30; // OTP expires in 5 minutes
   

           const userCheck = await User.findOne({email:req.body.email})
           if(userCheck)
           {
               res.send("user already exist");
           }else{

           const spassword = await securePassword(req.body.password);
            req.session.Fname = req.body.Fname;
            req.session.Lname = req.body.Lname;
            req.session.mobile = req.body.mobile;
            req.session.email = req.body.email;
            
            if(req.body.Fname && req.body.email && req.body.Lname&& req.body.mobile){
                if(req.body.password === req.body.Cpassword) {
                    req.session.password = spassword;
                    req.session.otp = {
                        code: otpCode,
                        expiry: expirationTime,
                    };        
                        // Send OTP to the user's email
                        sendVerificationEmail(req.session.email, req.session.otp.code);
                       
                        res.render("userOtp")
                    } else {
                        res.render("registration",{message: "Password doesn't match"})
                    }
                }
                else{
                    res.render("registration",{message: "Please enter all details"})
                }

            
           }
           
    } catch (error) {
        console.log(error); 
    }

}

//======= user data inserting to database =======
const insertUser = async(req,res)=>{

    try {
        if(req.body.otp === req.session.otp.code){

            const user = new User({
                firstName: req.session.Fname,
                lastName: req.session.Lname,
                email: req.session.email,
                mobile: req.session.mobile,
                password: req.session.password,
                isVerified:1,
                isBlock:0

            })    

            const result = await user.save()
            res.redirect("/login")
        }
        else{
            res.render('userOtp',{message:"invalid OTP"});
        }
    } catch (error) {
        console.log(error.message);
    }
    
}

//====== loding home page ======
const verifLoadHome = async (req, res,next) => {

    console.log('bfxfbx');
        try {
            const Email = req.body.email
            const Password = req.body.password
    
            const userData = await User.findOne({ email:Email})
            if (userData) {
    
                if (userData.isBlock == false) {
    
    
                    const passwordMatch = await bcrypt.compare(Password, userData.password)
    
                    if (passwordMatch) {
                        if (userData.isVerified == false) {
    
                            res.render('login', { message: "please verify your mail" })
                        }
                        else {
    
    
                            req.session.userid = userData._id
    
                            res.redirect('/')
                        }
                    }
                    else {
                        res.render('login', { message: "Email and  password is incorrect" })
                    }
    
                } else {
    
                    res.render('login', { message: "This User is blocked" })
                }
            }
            else {
                res.render('login', { message: "Email and  password is incorrect" })
    
            }
        }
        catch (err) {
    
            next(err)
    }
    
}


module.exports = {
    loginLoad ,
    loadRegister,
    loadOtpPage,
    insertUser,
    verifyOtp,
    verifLoadHome,
    loadHome
    
};