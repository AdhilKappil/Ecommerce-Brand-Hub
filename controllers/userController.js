const User = require("../models/users");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const path = require("path");
const otpGenerator = require("otp-generator");
const Product = require("../models/product");
const Category = require("../models/category");
const Address = require("../models/userAddress");
const Banner = require("../models/banner");
const shortid = require("shortid");
const { ObjectId } = require("mongodb");



// ========== pasword security ==========
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};



// ========= user login ===========
const loginLoad = async (req, res, next) => {
  try {
    res.render("login");
  } catch (error) {
    next(error);
  }
};



// ======== rendering home page ========
const loadHome = async (req, res, next) => {
  try {
    const categoryDetails = await Category.find({});
    const banner = await Banner.find({ status: true }).sort({ position: 1 });
    const products = await Product.find({ status: true })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("category");
    res.render("home", {
      user: req.session.user_id,
      catData: categoryDetails,
      product: products,
      banner,
    });
  } catch (error) {
    next(error);
  }
};



// =======user registraion =======
const loadRegister = async (req, res, next) => {
  try {
    res.render("registration");
  } catch (error) {
    next(error);
  }
};



// ========= sending otp to email =======
const sendVerificationEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "adhilaliotheruse@gmail.com",
        pass: process.env.smtp,
      },
    });

    const mailOptions = {
      from: "adhilaliotheruse@gmail.com",
      to: email,
      subject: "Verify Your Email",
      html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error);
  }
};



// ========== sending reset password link to the email ==========
const resetPasswordMail = async (firstName, lastName, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "adhilaliotheruse@gmail.com",
        pass: process.env.smtp,
      },
    });

    const mailOptions = {
      from: "adhilaliotheruse@gmail.com",
      to: email,
      subject: "For Reset Password",
      html: `<p> Hi, ${firstName} ${lastName}, please click here to <a href="http://127.0.0.1:3000/changePassword?token=${token}"> Reset </a> your password</p>`,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent:-", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};



// ========== user otp ============
const loadOtpPage = async (req, res, next) => {
  try {
    res.redirect("/userOtp");
  } catch (error) {
    next(error);
  }
};



// ========== ottp verification and otp storing in session ===========
const verifyOtp = async (req, res, next) => {
  try {
    // Generate OTP
    const otpCode = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      specialChars: false,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
    });
    const otpcurTime = Date.now() / 1000;
    const otpExpiry = otpcurTime + 60;

    const userCheck = await User.findOne({ email: req.body.email });
    if (userCheck) {
      res.render("registration", {
        message: "Email already exist change your email",
      });
    } else {
      const spassword = await securePassword(req.body.password);
      req.session.Fname = req.body.Fname;
      req.session.Lname = req.body.Lname;
      req.session.mobile = req.body.mobile;
      req.session.email = req.body.email;

      if (req.body.referralCode) {
        // Check if the referral code provided by the user exists
        const referringUser = await User.findOne({
          referralCode: req.body.referralCode,
        });

        if (referringUser) {
          req.session.referralUserId = referringUser._id; // Save referring user ID in session
        } else {
          res.render("registration", {
            message: "Invalid referral code. Please use a valid referral code.",
          });
          return;
        }
      }

      // Generate a unique referral code using shortid
      const referralCode = shortid.generate();
      req.session.referralCode = referralCode;

      if (
        req.body.Fname &&
        req.body.email &&
        req.body.Lname &&
        req.body.mobile
      ) {
        if (req.body.password === req.body.Cpassword) {
          req.session.password = spassword;
          req.session.otp = {
            code: otpCode,
            expiry: otpExpiry,
          };
          // Send OTP to the user's email
          sendVerificationEmail(req.session.email, req.session.otp.code);
          res.render("userOtp", {
            message: "OTP has been send to your emaiil",
          });
        } else {
          res.render("registration", { message: "Password doesn't match" });
        }
      } else {
        res.render("registration", { message: "Please enter all details" });
      }
    }
  } catch (error) {
    next(error);
  }
};



// ======= user data inserting to database =======
const insertUser = async (req, res, next) => {
  try {
    const currentTime = Math.floor(Date.now() / 1000);
    if (
      req.body.otp === req.session.otp.code &&
      currentTime <= req.session.otp.expiry
    ) {
      const user = new User({
        firstName: req.session.Fname,
        lastName: req.session.Lname,
        email: req.session.email,
        mobile: req.session.mobile,
        password: req.session.password,
        referralCode: req.session.referralCode,
        isVerified: 1,
        isBlock: 0,
      });

      const result = await user.save();

      if (req.session.referralUserId) {
        const referringUser = await User.findById(req.session.referralUserId);

        const bonusAmount = 100;

        referringUser.wallet += bonusAmount;
        referringUser.walletHistory.push({
          transactionDate: new Date(),
          transactionAmount: bonusAmount,
          transactionDetails: `Referral bonus for user ${result.firstName}`,
          transactionType: "Credit",
        });
        await referringUser.save();

        result.wallet += bonusAmount;
        result.walletHistory.push({
          transactionDate: new Date(),
          transactionAmount: bonusAmount,
          transactionDetails: "Referral bonus",
          transactionType: "Credit",
        });
        await result.save();
      }

      res.json({ success: true });
    } else {
      res.json({ success: false, message: "Invalid OTP" });
    }
  } catch (error) {
    next(error);
  }
};



// ========== resend otp ==========
const resendOtp = async (req, res, next) => {
  try {
    const currentTime = Date.now() / 1000;
    if (req.session.otp.expiry != null) {
      if (currentTime > req.session.otp.expiry) {
        const newDigit = otpGenerator.generate(6, {
          digits: true,
          alphabets: false,
          specialChars: false,
          upperCaseAlphabets: false,
          lowerCaseAlphabets: false,
        });
        req.session.otp.code = newDigit;
        const newExpiry = currentTime + 60;
        req.session.otp.expiry = newExpiry;
        sendVerificationEmail(req.session.email, req.session.otp.code);
        res.render("userOtp", { message: "OTP has been send to your emaiil" });
      } else {
        res.render("userOtp", {
          message: "You can request a new otp after old otp expires",
        });
      }
    } else {
      res.send("Please register again");
    }
  } catch (error) {
    next(error);
  }
};



//====== loding home page ======
const verifLoadHome = async (req, res, next) => {
  try {
    const Email = req.body.email;
    const Password = req.body.password;

    const userData = await User.findOne({ email: Email });
    if (userData) {
      if (userData.isBlock == false) {
        const passwordMatch = await bcrypt.compare(Password, userData.password);

        if (passwordMatch) {
          if (userData.isVerified == false) {
            res.render("login", { message: "please verify your mail" });
          } else {
            req.session.user_id = userData._id;

            res.redirect("/");
          }
        } else {
          res.render("login", { message: "Email or password is incorrect" });
        }
      } else {
        res.render("login", { message: "This User is blocked" });
      }
    } else {
      res.render("login", { message: "Email or password is incorrect" });
    }
  } catch (error) {
    next(error);
  }
};



// =========load forgot password ==========
const loadForgotPassword = async (req, res, next) => {
  try {
    res.render("forgotPassword");
  } catch (error) {
    next(error);
  }
};



// ======== veryfiying and creating token ========
const forgotVerify = async (req, res, next) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });

    if (userData) {
      if (userData.isVerified === 0) {
        res.render("forgotPassword", { message: "Please verify your mail" });
      } else {
        const randomString = randomstring.generate();
        const updatedData = await User.updateOne(
          { email: email },
          { $set: { token: randomString } }
        );
        resetPasswordMail(
          userData.firstName,
          userData.lastName,
          userData.email,
          randomString
        );
        res.render("forgotPassword", {
          message: "Please check your mail to reset your password",
        });
      }
    } else {
      res.render("forgotPassword", { message: "User email is incorrect" });
    }
  } catch (error) {
    next(error);
  }
};



// ========== changing password ===========
const loadChangePassword = async (req, res, next) => {
  try {
    const token = req.query.token;
    const tokenData = await User.findOne({ token: token });
    if (tokenData) {
      res.render("changePassword", { user_id: tokenData._id });
    } else {
      res.render("404", { message: "Token is invalid" });
    }
  } catch (error) {
    console.log(error.message);
  }
};



const updatePassword = async (req, res) => {
  try {
    const password = req.body.password;
    const user_id = req.body.user_id;

    const spassword = await securePassword(password);

    const updatedData = await User.findByIdAndUpdate(
      { _id: user_id },
      { $set: { password: spassword, token: "" } }
    );

    res.redirect("/login");
  } catch (error) {
    next(error);
  }
};



// ========== rendering the shop page ==========
const loadProducts = async (req, res, next) => {
  try {
    const perPage = 12; // Number of products per page
    let page = parseInt(req.query.page) || 1;
    const categoryDetails = await Category.find({});
    const totalProducts = await Product.countDocuments({ status: true });
    const totalPages = Math.ceil(totalProducts / perPage);
    const brands = await Product.aggregate([{ $group: { _id: "$brand" } }]);

    let search = "";

    if (req.query.search) {
      search = req.query.search;
    }

    async function getCategoryIds(search) {
      const categories = await Category.find({
        name: { $regex: ".*" + search + ".*", $options: "i" },
      });
      return categories.map((category) => category._id);
    }

    let minPrice = 1;
    let maxPrice = 20000;

    if (req.query.minPrice) {
      minPrice = req.query.minPrice;
    }
    if (req.query.maxPrice) {
      maxPrice = req.query.maxPrice;
    }

    const query = {
      status: true,
      $or: [
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
        { brand: { $regex: ".*" + search + ".*", $options: "i" } },
        { productName: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
      price: { $gte: minPrice, $lte: maxPrice },
    };

    if (page < 1) {
      page = 1;
    } else if (page > totalPages) {
      page = totalPages;
    }

    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.brand) {
      query.brand = req.query.brand;
    }

    let products = await Product.find(query)
      .populate("offer")
      .populate("category")
      .skip((page - 1) * perPage)
      .limit(perPage);

    let sortValue = -1;
    if (req.query.sortValue) {
      if (req.query.sortValue === "2") {
        sortValue = 1;
      } else if (req.query.sortValue === "1") {
        sortValue = -1;
      } else {
        sortValue = -1;
      }
    }

    if (req.query.sortValue && req.query.sortValue != 3) {
      products = await Product.find(query)
        .populate("category")
        .populate("offer")
        .sort({ price: sortValue })
        .limit(perPage)
        .skip((page - 1) * perPage);
    } else {
      products = await Product.find(query)
        .populate("category")
        .populate("offer")
        .sort({ createdAt: sortValue })
        .limit(perPage)
        .skip((page - 1) * perPage);
    }

    res.render("product", {
      catData: categoryDetails,
      product: products,
      currentPage: page,
      pages: totalPages,
      user: req.session.user_id,
      brand: req.query.brand,
      sortValue: req.query.sortValue,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      search: req.query.search,
      category: req.query.category,
      brands,
    });
  } catch (error) {
    next(error);
  }
};



// ========== loading produt details page =============
const loadProductDetails = async (req, res, next) => {
  try {
    const id = req.query.id;

    const products = await Product.findById({ _id: id }).populate("offer");
    res.render("productDetails", {
      product: products,
      user: req.session.user_id,
    });
  } catch (error) {
    next(error);
  }
};



// ======== user logout ==========
const userLogout = async (req, res, next) => {
  try {
    req.session.user_id = null;
    res.redirect("/login");
  } catch (error) {
    next(error);
  }
};




module.exports = {
  loginLoad,
  loadRegister,
  loadOtpPage,
  insertUser,
  verifyOtp,
  verifLoadHome,
  loadHome,
  resendOtp,
  loadForgotPassword,
  forgotVerify,
  loadChangePassword,
  updatePassword,
  loadProducts,
  loadProductDetails,
  userLogout,
};
