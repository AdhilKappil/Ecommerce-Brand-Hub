const mongoose = require("mongoose");
const Coupon = require("../models/coupon");
const Cart = require("../models/cart");




// ======== rendering the coupon page ========
const loadaddCoupon = async (req, res, next) => {
  try {
    res.render("addCoupon");
  } catch (err) {
    next(err);
  }
};



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
      res.render("addCoupon", { message: "Code already exists" });
    } else {
      const newCoupon = new Coupon({
        code: req.body.code,
        discountPercentage: req.body.discountPercentage,
        startDate: req.body.startDate,
        expireDate: req.body.expiryDate,
        minimumSpend: req.body.minimumSpend,
      });

      await newCoupon.save();
      res.render("addCoupon", { message: "Coupon added successfully!." });
    }
  } catch (err) {
    next(err);
  }
};



// =========== rendering the coupon page ===========
const loadCoupon = async (req, res, next) => {
  try {
    const couponData = await Coupon.find();
    res.render("coupon", { couponData });
  } catch (err) {
    next(err);
  }
};



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

    res.render("editCoupon", { data: couponData[0] });
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

    res.redirect("/admin/coupon");
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
          _id: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $limit: 1,
      },
    ]);

    // Check if the coupon exists
    if (deletedCoupon.length === 0) {
      return res.json({ success: false, message: "Coupon not found" });
    }

    // Delete the coupon
    await Coupon.deleteOne({ _id: id });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};



// === cheking coupon detailes and applaying coupon before the place order ===
const couponCheck = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const couponCode = req.body.couponCode;
    const total = req.body.total;
    const couponData = await Coupon.findOne({ code: couponCode });
    const max = couponData.minimumSpend;

    const totalAmount = await calculateTotalPrice(userId);

    if (couponData) {
      const userExist = couponData.user.find(
        (u) => u.toString() === req.session.user_id
      );

      if (userExist) {
        res.json({ failed: true, message: "Coupon already used by the user." });
      } else {
        // Check if the coupon is valid based on dates
        const currentDate = new Date();
        if (
          currentDate < couponData.startDate ||
          currentDate > couponData.expireDate
        ) {
          res.json({ failed: true, message: "Coupon is not currently valid." });
          return;
        }

        if (total === totalAmount) {
          if (couponData.minimumSpend <= total) {
            // Store coupon code in session
            req.session.code = couponCode;

            // Calculate discount and new total
            const discountTotal = Math.floor(
              (couponData.discountPercentage / 100) * total
            );
            const newTotal = total - discountTotal;

            await Coupon.findOneAndUpdate(
              { code: couponCode },
              { $push: { user: userId } }
            );

            // Store coupon information in session
            req.session.coupon = {
              code: couponCode,
              discountTotal: discountTotal,
              minimumSpend: couponData.minimumSpend,
              discountPercentage: couponData.discountPercentage,
            };

            res.json({ success: true, newTotal: newTotal });
          } else {
            res.json({
              failed: true,
              message: `Coupon is applicable for the purchase of ₹${max} or above`,
            });
          }
        } else {
          res.json({
            failed: true,
            message: "Cannot apply coupon to this amount.",
          });
        }
      }
    } else {
      res.json({ failed: true, message: "Invalid coupon code." });
    }
  } catch (err) {
    next(err);
  }
};



// ========== calculating the total price ========
const calculateTotalPrice = async (userId) => {
  try {
    const cart = await Cart.findOne({ user: userId }).populate(
      "products.productId"
    );

    if (!cart) {
      console.log("User does not have a cart.");
    }

    let totalPrice = 0;
    for (const cartProduct of cart.products) {
      const { productId, quantity } = cartProduct;
      const productSubtotal = productId.price * quantity;
      totalPrice += productSubtotal;
    }

    return totalPrice;
  } catch (error) {
    console.error("Error calculating total price:", error.message);
    return 0;
  }
};



// ===== canceling the coupon befor placing order ======
const removeCoupon = async (req, res, next) => {
  try {
    const userId = req.session.user_id;

    // Assuming you have stored the applied coupon code in req.session.coupon.code
    const appliedCouponCode = req.session.coupon
      ? req.session.coupon.code
      : null;

    if (!appliedCouponCode) {
      return res.json({ failed: true, message: "No coupon applied." });
    }

    // Remove the applied coupon from the user's list
    await Coupon.findOneAndUpdate(
      { code: appliedCouponCode },
      { $pull: { user: userId } }
    );

    // Clear coupon-related data from the session
    req.session.coupon = null;

    // Get the updated cart total after removing the coupon
    const totalAmount = await calculateTotalPrice(userId);

    res.json({ success: true, updatedTotal: totalAmount });
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
  deleteCoupon,
  couponCheck,
  removeCoupon,
};
