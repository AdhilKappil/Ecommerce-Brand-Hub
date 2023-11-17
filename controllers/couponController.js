const mongoose = require("mongoose");
const Coupon = require("../models/coupon");




// ======== rendering the coupon page ========
const loadaddCoupon = async (req, res,next) => {
    try {
      res.render('addCoupon')
    } catch (err) {
    next(err)
    }
}



// ====== iserting coupon ========
const addCoupon = async (req, res, next) => {
  try {
    const code = req.body.code;

    const already = await Coupon.aggregate([
      {
        $match: {
          code: code,
        },
      },
      {
        $limit: 1,
      },
    ]);

    if (already.length > 0) {
      res.render('addCoupon', { message: 'Code already exists' });
    } else {
      const newCoupon = new Coupon({
        code: req.body.code,
        discountPercentage: req.body.discountPercentage,
        startDate: req.body.startDate,
        expireDate: req.body.expiryDate,
        minimumSpend: req.body.minimumSpend
      });

      await newCoupon.save();
      res.render('addCoupon',{message:"Coupon added successfully!."});
    }
  } catch (err) {
    next(err);
  }
};



// =========== rendering the coupon page =========== 
const loadCoupon = async (req, res,next) => {
  try {
    const couponData = await Coupon.find()
    res.render('coupon', { couponData })
  } catch (err) {
  next(err)
  }
}




// ============= rendiring coupon eidt page ==========
const loadEditCoupon = async (req, res, next) => {
  try {
    const id = req.query.id;

    const couponData = await Coupon.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
        },
      },
    ]);

    res.render('editCoupon', { data: couponData[0] }); 
  } catch (err) {
    next(err);
  }
};



// =========== edit coupon ===========
const editCoupon = async (req, res, next) => {
  try {
    const id = req.body.id;
    const code = req.body.code;
    const discountPercentage = req.body.discountPercentage;
    const minimumSpend = req.body.minimumSpend;
    const startDate = req.body.startDate;
    const expireDate = req.body.expiryDate;

    // Update document based on _id
    await Coupon.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          code: code,
          discountPercentage: discountPercentage,
          minimumSpend: minimumSpend,
          startDate: startDate,
          expireDate: expireDate,
        },
      }
    );

    res.redirect('/admin/coupon');
  } catch (err) {
    next(err);
  }
};



// ========= deleting the coupon ===========
const deleteCoupon = async (req, res, next) => {
  try {
    const id = req.body.id;

    // Using aggregate to match the coupon by ID
    const deletedCoupon = await Coupon.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id)
        }
      },
      {
        $limit: 1
      }
    ]);

    // Check if the coupon exists
    if (deletedCoupon.length === 0) {
      return res.json({ success: false, message: 'Coupon not found' });
    }

    // Delete the coupon
    await Coupon.deleteOne({ _id: id });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};



module.exports = {
  loadaddCoupon,
  addCoupon,
  loadCoupon,
  editCoupon,
  loadEditCoupon,
  deleteCoupon
  
};


 




