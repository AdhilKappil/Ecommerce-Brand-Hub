const mongoose = require("mongoose");
const Cart = require("../models/cart");
const Product = require("../models/product");
const User = require("../models/users");
const Address = require("../models/userAddress");
const Order = require("../models/order");
const Coupon = require("../models/coupon");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { findById } = require("../models/admin");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");




// =========== razorpay instance ===========
var instance = new Razorpay({
  key_id: process.env.razorpaykey_id,
  key_secret: process.env.razorpaykey_secret,
});



// ==== cart items price calculate function here ====
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
      if (productId.discountedPrice > 0) {
        const productSubtotal = productId.discountedPrice * quantity;
        totalPrice += productSubtotal;
      } else {
        const productSubtotal = productId.price * quantity;
        totalPrice += productSubtotal;
      }
    }

    return totalPrice;
  } catch (error) {
    console.error("Error calculating total price:", error.message);
    return 0;
  }
};



// ======== loading chekout page =========
const loadCheckout = async (req, res, next) => {
  try {
    const cartDetails = await Cart.findOne({ user: req.session.user_id })
      .populate({
        path: "products.productId",
        select: "productName price discountedPrice",
      })
      .exec();

    if (cartDetails) {
      const total = await calculateTotalPrice(req.session.user_id);
      const userAddress = await Address.findOne(
        { userId: req.session.user_id },
        { address: 1 }
      );
      if (userAddress) {
        return res.render("checkout", {
          user: req.session.user_id,
          total,
          address: userAddress.address,
          products: cartDetails.products,
        });
      } else {
        return res.render("checkout", {
          user: req.session.user_id,
          total,
          address: 0,
          products: cartDetails.products,
        });
      }
    } else {
      return res.redirect("/cart");
    }
  } catch (error) {
    next(error);
  }
};



// =========== adding user address =========
const addShippingAddress = async (req, res, next) => {
  try {
    let userAddress = await Address.findOne({ userId: req.session.user_id });
    if (!userAddress) {
      userAddress = new Address({
        userId: req.session.user_id,
        address: [
          {
            fullName: req.body.fullName,
            mobile: req.body.mobile,
            state: req.body.state,
            district: req.body.district,
            city: req.body.city,
            pincode: req.body.pincode,
          },
        ],
      });
    } else {
      userAddress.address.push({
        fullName: req.body.fullName,
        mobile: req.body.mobile,
        state: req.body.state,
        district: req.body.district,
        city: req.body.city,
        pincode: req.body.pincode,
      });
    }

    let result = await userAddress.save();

    res.redirect("/checkout");
  } catch (error) {
    next(error);
  }
};



// ======== genarate Order uniq Id ===========
const generateUniqueTrackId = async () => {
  try {
    let orderID;
    let isUnique = false;

    // Keep generating order IDs until a unique one is found
    while (!isUnique) {
      // Generate a random 6-digit number
      orderID = Math.floor(100000 + Math.random() * 900000);

      // Check if the order ID already exists in the database
      const existingOrder = await Order.findOne({ orderID });

      // If no existing order with the same orderID is found, it's unique
      if (!existingOrder) {
        isUnique = true;
      }
    }

    return orderID;
  } catch (error) {
    console.log(error.message);
  }
};



// =========== place order ===========
const placeOrder = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const addressId = req.body.address;
    const paymentType = req.body.payment;
    const totalAmount = parseInt(req.body.amount);
    const cartDetails = await Cart.findOne({ user: userId });

    const userAddrs = await Address.findOne({ userId: userId });
    const shipAddress = userAddrs.address.find((address) => {
      return address._id.toString() === addressId.toString();
    });

    if (!shipAddress) {
      return res.status(400).json({ error: "Address not found" });
    }

    const user = await User.findById(req.session.user_id);

    // cheking the product stock
    const productQuantity = await checkProductQuantities(userId);
    if (productQuantity === false) {
      return res.status(202).send({});
    }

    let discountTotal = 0;
    let appliedCoupon = null;

    if (req.session.coupon) {
      discountTotal = req.session.coupon.discountTotal;
      appliedCoupon = {
        code: req.session.coupon.code,
        discountTotal: req.session.coupon.discountTotal,
        minimumSpend: req.session.coupon.minimumSpend,
        discountPercentage: req.session.coupon.discountPercentage,
      };
      req.session.coupon = null;
    }

    let total = await calculateTotalPrice(userId);
    total = total - discountTotal;

    // chekking the wallet balance
    if (paymentType === "Wallet" && user.wallet < totalAmount) {
      return res.status(201).json({});
    }

    const { fullName, mobile, state, district, city, pincode } = shipAddress;

    const productIDs = cartDetails.products.map(
      (productItem) => productItem.productId
    );

    const productPrices = []; // Array to store product prices

    const productData = await Cart.find({
      "products.productId": { $in: productIDs },
    })
      .populate({
        path: "products.productId",
        select: "price discountedPrice",
      })
      .exec();

    if (productData && productData.length > 0) {
      productData.forEach((order) => {
        if (order.products && order.products.length > 0) {
          order.products.forEach((product) => {
            const price =
              product.productId.discountedPrice || product.productId.price;
            productPrices.push(price); // Store the price in the array
          });
        } else {
          console.log("Products array is empty in the order");
        }
      });
    } else {
      console.log("No matching orders found");
    }

    // Now update the cartProducts with prices
    const cartProducts = cartDetails.products.map((productItem, index) => ({
      productId: productItem.productId,
      quantity: productItem.quantity,
      OrderStatus: "Pending",
      StatusLevel: 1,
      price: productPrices[index], // Use the corresponding price from the array
      paymentStatus: "Pending",
      "returnOrderStatus.status": "none",
      "returnOrderStatus.reason": "none",
    }));

    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 7);

    const trackId = await generateUniqueTrackId();
    const order = new Order({
      userId: req.session.user_id,
      "shippingAddress.fullName": fullName,
      "shippingAddress.mobile": mobile,
      "shippingAddress.state": state,
      "shippingAddress.district": district,
      "shippingAddress.city": city,
      "shippingAddress.pincode": pincode,
      products: cartProducts,
      totalAmount: total,
      paymentMethod: paymentType,
      expectedDelivery: deliveryDate,
      orderDate: new Date(),
      trackId,
      coupon: appliedCoupon,
    });

    const placeorder = await order.save();
    const orderId = placeorder._id;

    if (paymentType === "COD" || paymentType === "Wallet") {
      for (const item of cartDetails.products) {
        const productId = item.productId._id;
        const quantity = parseInt(item.quantity, 10);

        if (paymentType === "Wallet") {
          let changeOrderStatus = await Order.updateOne(
            { _id: placeorder._id },
            {
              $set: {
                "products.$[].paymentStatus": "Success",
                "products.$[].OrderStatus": "Placed",
              },
            }
          );
          const walletHistory = {
            transactionDate: new Date(),
            transactionDetails: "Product Purchased",
            transactionType: "Debit",
            transactionAmount: totalAmount,
            orderId: trackId,
            currentBalance: !isNaN(userId.wallet)
              ? userId.wallet + amount
              : totalAmount,
          };
          await User.findByIdAndUpdate(
            { _id: userId },
            {
              $inc: {
                wallet: -totalAmount,
              },
              $push: {
                walletHistory,
              },
            }
          );
        } else {
          let changeOrderStatus = await Order.updateOne(
            { _id: placeorder._id },
            {
              $set: {
                "products.$[].OrderStatus": "Placed",
              },
            }
          );
        }

        await Product.findByIdAndUpdate(
          { _id: productId },
          {
            $inc: { quantity: -quantity },
          }
        );
      }

      res
        .status(200)
        .json({ placeorder, message: "Order placed successfully" });

      await Cart.findOneAndDelete({ userid: req.body.user_id });
    } else if (paymentType === "Online Payment") {
      var options = {
        amount: total * 100,
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.error(err); // Handle any errors that occurred during the API call
        } else {
          res.status(400).json({ order });
        }
      });
    }
  } catch (error) {
    next(error);
  }
};



// ========= Function to Checkout product Stock Check =========
const checkProductQuantities = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate(
    "products.productId"
  );

  for (const item of cart.products) {
    const productId = item.productId._id;
    const product = await Product.findById(productId);

    if (!product || item.quantity > product.quantity) {
      return false;
    }
  }
  return true;
};



// =========== payment varification =============
const verifyPayment = async (req, res, next) => {
  try {
    const cartData = await Cart.findOne({ user: req.session.user_id });
    const products = cartData.products;
    const details = req.body;
    const hmac = crypto.createHmac("sha256", instance.key_secret);

    hmac.update(
      details.payment.razorpay_order_id +
        "|" +
        details.payment.razorpay_payment_id
    );
    const hmacValue = hmac.digest("hex");

    if (hmacValue === details.payment.razorpay_signature) {
      for (let i = 0; i < products.length; i++) {
        const productId = products[i].productId;
        const quantity = products[i].quantity;
        await Product.findByIdAndUpdate(
          { _id: productId },
          { $inc: { quantity: -quantity } }
        );
      }
      await Order.findByIdAndUpdate(
        { _id: details.order.receipt },
        {
          $set: {
            "products.$[].paymentStatus": "Success",
            "products.$[].OrderStatus": "Placed",
          },
        }
      );

      await Order.findByIdAndUpdate(
        { _id: details.order.receipt },
        { $set: { paymentId: details.payment.razorpay_payment_id } }
      );
      await Cart.deleteOne({ user: req.session.user_id });
      const orderid = details.order.receipt;

      res.json({ razorpaySuccess: true, orderid });
    } else {
      await Order.findByIdAndRemove({ _id: details.order.receipt });
      res.json({ success: false });
    }
  } catch (error) {
    next(error);
  }
};



// =========== rendering order history page user side ============
const loadOrderPage = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const cart = await Cart.findOne({ user: userId });
    const userData = await User.findById({ _id: userId });

    const orderData = await Order.find({ userId: userId }).sort({
      orderDate: -1,
    });

    res.render("orders", { user: userData, orders: orderData });
  } catch (error) {
    next(error);
  }
};



// ========= rendering order details page user side ==========
const loadOrderDetailes = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const orderId = req.query.id;

    let order; // Declare order variable outside the if-else block

    if (orderId) {
      order = await Order.findOne({ _id: orderId })
        .populate({
          path: "products.productId",
        })
        .sort({ orderDate: -1 });
    } else {
      order = await Order.findOne({ userId: userId })
        .populate({
          path: "products.productId",
        })
        .sort({ orderDate: -1 });
    }

    const products = await Cart.findOne({ user: userId }).populate(
      "products.productId"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No orders found for the user.",
      });
    }

    res.render("orderDetails", { order, products, user: req.session.user_id });
  } catch (err) {
    next(err);
  }
};



// ============ loading admin side order page ==========
const loadAdminOrder = async (req, res, next) => {
  try {
    const orders = await Order.find();

    const productWiseOrdersArray = [];

    for (const order of orders) {
      for (const productInfo of order.products) {
        const productId = productInfo.productId;

        const product = await Product.findById(productId).select(
          "productName images price "
        );
        const userDetails = await User.findById(order.userId).select("email");

        if (product) {
          // Push the order details with product details into the array
          productWiseOrdersArray.push({
            user: userDetails,
            product: product,
            orderDetails: {
              _id: order._id,
              userId: order.userId,
              shippingAddress: order.shippingAddress,
              orderDate: order.orderDate,
              totalAmount: productInfo.quantity * productInfo.price,
              OrderStatus: productInfo.OrderStatus,
              StatusLevel: productInfo.StatusLevel,
              paymentStatus: productInfo.paymentStatus,
              paymentMethod: order.paymentMethod,
              quantity: productInfo.quantity,
            },
          });
        }
      }
    }

    res.render("order", { orders: productWiseOrdersArray });
  } catch (error) {
    next(error);
  }
};



// ========= admin side managinge the order ==========
const orderMangeLoad = async (req, res, next) => {
  try {
    const { orderId, productId } = req.query;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).render("error-404");
    }
    const productInfo = order.products.find(
      (product) => product.productId.toString() === productId
    );
    const product = await Product.findById(productId).select(
      "productName images price"
    );

    const productOrder = {
      orderId: order._id,
      product: product,
      orderDetails: {
        _id: order._id,
        userId: order.userId,
        shippingAddress: order.shippingAddress,
        orderDate: order.orderDate,
        totalAmount: order.totalAmount,
        OrderStatus: productInfo.OrderStatus,
        StatusLevel: productInfo.StatusLevel,
        paymentMethod: order.paymentMethod,
        paymentStatus: productInfo.paymentStatus,
        quantity: productInfo.quantity,
        price: productInfo.price,
      },
    };

    res.render("orderManagment", { product: productOrder, orderId, productId });
  } catch (error) {
    next(error);
  }
};



// =========== user side cancel order ==========
const cancelOrder = async (req, res, next) => {
  try {
    const orderId = req.body.orderId;
    const productId = req.body.productId;
    const userId = req.session.user_id;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const productInfo = order.products.find(
      (product) => product.productId.toString() === productId
    );

    // const productDetails = await Product.findById(productInfo.productId);
    let totalAmount = productInfo.quantity * productInfo.price;

    let couponRefundAmount = 0;
    let cartTotal = order.totalAmount;

    if (order.coupon.code) {
      const couponData = await Coupon.findOne({ code: order.coupon.code });
      let totalWithoutCoupon = order.coupon.discountTotal + cartTotal;

      if (
        couponData &&
        Math.abs(totalWithoutCoupon - totalAmount) < couponData.minimumSpend
      ) {
        totalWithoutCoupon = await order.products.reduce(
          async (totalPromise, product) => {
            const total = await totalPromise;
            if (
              product.productId._id.toString() !== productId &&
              product.OrderStatus !== "Cancelled"
            ) {
              const productDetailsWithoutCancelled = await Product.findById(
                product.productId
              );
              return (
                total + productDetailsWithoutCancelled.price * product.quantity
              );
            }
            return total;
          },
          Promise.resolve(0)
        );

        totalAmount = cartTotal - totalWithoutCoupon;
      } else {
        const couponRefundPercentage = couponData.discountPercentage || 0;
        couponRefundAmount = (couponRefundPercentage / 100) * totalAmount;
        totalAmount -= couponRefundAmount;
      }
    }

    productInfo.OrderStatus = "Cancelled";
    productInfo.updatedAt = Date.now();

    await Promise.all([
      order.save(),
      Product.findByIdAndUpdate(
        { _id: productId },
        { $inc: { quantity: productInfo.quantity } }
      ),
    ]);

    // ========== adding money to wallet =========
    if (productInfo.paymentStatus === "Success") {
      const walletHistory = {
        transactionDate: new Date(),
        transactionDetails: "Refund",
        transactionType: "Credit",
        transactionAmount: totalAmount,
        orderId: order.trackId,
        currentBalance: !isNaN(userId.wallet)
          ? userId.wallet + totalAmount
          : totalAmount,
      };

      await User.findByIdAndUpdate(
        { _id: userId },
        {
          $inc: { wallet: totalAmount },
          $push: { walletHistory },
        }
      );

      productInfo.paymentStatus = "Refund";
      await order.save();
    }

    res.json({ cancel: 1 });
  } catch (error) {
    next(error);
  }
};



// =========== admin side order status managment ============
const changeOrderStatus = async (req, res, next) => {
  try {
    const { status, orderId, productId } = req.body;
    const order = await Order.findById(orderId);
    // find status level
    const statusMap = {
      Shipped: 2,
      OutforDelivery: 3,
      Delivered: 4,
    };

    const selectedStatus = status;
    const statusLevel = statusMap[selectedStatus];

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    // Find the product within the order by its ID (using .toString() for comparison)
    const productInfo = order.products.find(
      (product) => product.productId.toString() === productId
    );

    productInfo.OrderStatus = status;
    productInfo.StatusLevel = statusLevel;
    productInfo.updatedAt = Date.now();

    if (status === "Delivered") productInfo.paymentStatus = "Success";

    const result = await order.save();

    res.redirect(
      `/admin/order/orderManagment?orderId=${orderId}&productId=${productId}`
    );
  } catch (error) {
    next(error);
  }
};



// ========= admin cancel order ==========
const adminCancelOrder = async (req, res, next) => {
  try {
    const { orderId, productId } = req.body;

    const order = await Order.findById(orderId).populate("userId");

    const userId = order.userId._id;

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const productInfo = order.products.find(
      (product) => product.productId.toString() === productId
    );

    const totalAmount = productInfo.quantity * productInfo.price;

    if (productInfo) {
      productInfo.OrderStatus = "Cancelled";
      productInfo.updatedAt = Date.now();

      await order.save();

      await Product.findByIdAndUpdate(
        { _id: productId },
        {
          $inc: { quantity: productInfo.quantity },
        }
      );

      // ========== adding money to wallet =========
      if (productInfo.paymentStatus === "Success") {
        const walletHistory = {
          transactionDate: new Date(),
          transactionDetails: "Refund",
          transactionType: "Credit",
          transactionAmount: totalAmount,
          orderId: order.trackId,
          currentBalance: !isNaN(userId.wallet)
            ? userId.wallet + amount
            : totalAmount,
        };
        await User.findByIdAndUpdate(
          { _id: userId },
          {
            $inc: {
              wallet: totalAmount,
            },
            $push: {
              walletHistory,
            },
          }
        );
      }

      if (productInfo.paymentStatus === "Success") {
        productInfo.paymentStatus = "Refund";
        const result = await order.save();
      }

      return res.json({ cancel: 1, message: "Order successfully cancelled" });
    } else {
      return res
        .status(404)
        .json({ message: "Product not found in the order." });
    }
  } catch (error) {
    next(error);
  }
};



// ========== user invoice downloade ==========
const invoiceDownload = async (req, res, next) => {
  try {
    const orderId = req.query.id;
    const orderData = await Order.findById(orderId)
      .populate("products.productId")
      .populate("userId");

    if (!orderData) {
      return res.status(404).send("Order not found");
    }

    const userId = req.session.user_id;
    const userData = await User.findById(userId);

    const date = new Date();
    const data = {
      orderData: orderData,
      userData: userData,
      date,
    };

    res.render('invoice',{orderData,userData,date})
  } catch (error) {
    console.error("Error in invoiceDownload:", error);
    next(error);
  }
};




module.exports = {
  loadCheckout,
  addShippingAddress,
  placeOrder,
  verifyPayment,
  loadOrderPage,
  loadOrderDetailes,
  loadAdminOrder,
  orderMangeLoad,
  changeOrderStatus,
  cancelOrder,
  adminCancelOrder,
  invoiceDownload,
};
