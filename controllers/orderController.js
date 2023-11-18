const mongoose = require("mongoose");
const Cart = require("../models/cart");
const Product = require("../models/product");
const User = require("../models/users");
const Address = require("../models/userAddress");
const Order = require("../models/order");
const Coupon = require("../models/coupon");
const Analytics = require("../models/analytic");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { findById } = require("../models/admin");

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
      const productSubtotal = productId.price * quantity;
      totalPrice += productSubtotal;
    }

    return totalPrice;
  } catch (error) {
    console.error("Error calculating total price:", error.message);
    return 0;
  }
};

// ======== loading chekout page =========
const loadCheckout = async (req, res) => {
  try {
    const cartDetails = await Cart.findOne({ user: req.session.user_id })
      .populate({
        path: "products.productId",
        select: "productName price",
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
    console.log(error.message);
  }
};

// =========== adding user address =========
const addShippingAddress = async (req, res) => {
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
    console.log(error.message);
  }
};

//genarate Order uniq Id
// --------------------------
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
const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user_id
    const addressId = req.body.address;
    const paymentType = req.body.payment;
    const totalAmount = parseInt(req.body.amount);
    const cartDetails = await Cart.findOne({ user: userId  });

    const userAddrs = await Address.findOne({ userId: userId  });
    const shipAddress = userAddrs.address.find((address) => {
      return address._id.toString() === addressId.toString();
    });

    if (!shipAddress) {
      return res.status(400).json({ error: "Address not found" });
    }

    const user = await User.findById(req.session.user_id );

    // cheking the product stock
    const productQuantity = await  checkProductQuantities (userId);
    if (productQuantity === false){
      return res.status(202).send({})
    }

    let discountTotal = 0;
    let appliedCoupon = null;

    if (req.session.coupon) {

      console.log('hriiiii');
      
      discountTotal = req.session.coupon.discountTotal;
      appliedCoupon = {
        code: req.session.coupon.code,
        discountTotal: req.session.coupon.discountTotal,
        minimumSpend: req.session.coupon.minimumSpend,
        discountPercentage:req.session.coupon.discountPercentage
      };
      req.session.coupon = null;
    }

    let total = await calculateTotalPrice(userId );
        total = total- discountTotal;
    
    // chekking the wallet balance 
    if (paymentType === 'Wallet' && user.wallet < totalAmount) {
      return res.status(201).json({});
    }

    const { fullName, mobile, state, district, city, pincode } = shipAddress;

    const cartProducts = cartDetails.products.map((productItem) => ({
      productId: productItem.productId,
      quantity: productItem.quantity,
      OrderStatus: "Pending",
      StatusLevel: 1,
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

    // console.log(paymentType);

    if (paymentType === "COD" || paymentType === 'Wallet') {
      // console.log('here');
      for (const item of cartDetails.products) {
        const productId = item.productId._id;
        const quantity = parseInt(item.quantity, 10);

        if( paymentType === 'Wallet'){
         
          let changeOrderStatus = await Order.updateOne(
            { _id: placeorder._id },
            {
              $set: {
                'products.$[].paymentStatus': 'Success' ,"products.$[].OrderStatus": "Placed"
              },
            }
          );
          const walletHistory = {
            transactionDate: new Date(),
            transactionDetails: 'Product Purchased',
            transactionType: 'Debit',
            transactionAmount: totalAmount,
             currentBalance: !isNaN(userId.wallet) ? userId.wallet + amount : totalAmount
           }
            await User.findByIdAndUpdate(
                {_id: userId },
                {
                    $inc:{
                        wallet: -totalAmount
                    },
                    $push:{
                        walletHistory
                    }
                }
            );

         }else{
          // console.log('enterd cod');
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
      // res.json({ success: true });
      res.status(200) .json({ placeorder, message: "Order placed successfully" });

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
    console.log(error.message);
    res.status(500).json({ error: "An error occurred" });
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
const verifyPayment = async (req, res) => {
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
        { $set: { 'products.$[].paymentStatus': 'Success' ,"products.$[].OrderStatus": "Placed"}}
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
    console.log(error);
  }
};



// =========== rendering order history page user side ============
const loadOrderPage = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const cart = await Cart.findOne({ user: userId });
    const userData = await User.findById({ _id: userId });
    // let cartCount=0;

    // if(cart){
    //   cartCount = cart.products.length
    // }

    const orderData = await Order.find({ userId: userId }).sort({
      orderDate: -1,
    });

    res.render("orders", { user: userData, orders: orderData });
  } catch (error) {
    console.log(error);
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
const loadAdminOrder = async (req, res) => {
  try {
    const orders = await Order.find();

    const productWiseOrdersArray = [];

    for (const order of orders) {
      for (const productInfo of order.products) {
        const productId = productInfo.productId;

        const product = await Product.findById(productId).select(
          "productName images price"
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
              totalAmount: productInfo.quantity * product.price,
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
    console.log(error.message);
  }
};



// ========= admin side managinge the order ==========
const orderMangeLoad = async (req, res) => {
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
      },
    };

    res.render("orderManagment", { product: productOrder, orderId, productId });
  } catch (error) {
    console.log(error.message);
  }
};



// ========= user cancel order ==========
// const cancelOrder = async (req, res) => {
  
//   try {
//     const  oderId = req.body.orderId;
//     const  productId = req.body.productId;
//     const userId = req.session.user_id

//     const order = await Order.findById(oderId);

//     if (!order) {
//       return res.status(404).json({ message: "Order not found." });
//     }

//     // Find the product within the order by its ID (using .toString() for comparison)
//     const productInfo = order.products.find(
//       (product) => product.productId.toString() === productId
//     );

//     const productDetails = await Product.findById(productInfo.productId);

//     const totalAmount = productInfo.quantity* productDetails.price

    
//     productInfo.OrderStatus = "Cancelled";
//     productInfo.updatedAt = Date.now();
//     order.totalAmount -=  totalAmount
//     const result = await order.save();

//     await Product.findByIdAndUpdate(
//       { _id: productId },
//       {
//         $inc: { quantity: productInfo.quantity },
//       }
//     );

//     // ========== adding money to wallet =========
//     if(productInfo.paymentStatus==='Success'){
//       const walletHistory = {
//         transactionDate: new Date(),
//         transactionDetails: 'Refund',
//         transactionType: 'Credit',
//         transactionAmount: totalAmount,
//          currentBalance: !isNaN(userId.wallet) ? userId.wallet + amount : totalAmount
//        }
//         await User.findByIdAndUpdate(
//             {_id: userId },
//             {
//                 $inc:{
//                     wallet: totalAmount
//                 },
//                 $push:{
//                     walletHistory
//                 }
//             }
//         );

//     }

//     if(productInfo.paymentStatus==='Success'){
//       productInfo.paymentStatus= "Refund";
//       const result = await order.save();
//     }

//     res.json({ cancel: 1 });
//   } catch (error) {
//     console.log(error.message);
//   }
// };

const cancelOrder = async (req, res) => {
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

    const productDetails = await Product.findById(productInfo.productId);
    let totalAmount = productInfo.quantity * productDetails.price;

    let couponRefundAmount = 0;
    let cartTotal = order.totalAmount;

    if (order.coupon.code) {
      const couponData = await Coupon.findOne({ code: order.coupon.code });
      let totalWithoutCoupon = order.coupon.discountTotal + cartTotal;

      if (couponData && Math.abs(totalWithoutCoupon - totalAmount) < couponData.minimumSpend) {
        totalWithoutCoupon = await order.products.reduce(async (totalPromise, product) => {
          const total = await totalPromise;
          if (product.productId._id.toString() !== productId && product.OrderStatus !== 'Cancelled') {
            const productDetailsWithoutCancelled = await Product.findById(product.productId);
            return total + productDetailsWithoutCancelled.price * product.quantity;
          }
          return total;
        }, Promise.resolve(0));

        totalAmount = cartTotal - totalWithoutCoupon;
      } else {
        const couponRefundPercentage = couponData.discountPercentage || 0;
        couponRefundAmount = (couponRefundPercentage / 100) * totalAmount;
        totalAmount -= couponRefundAmount;
        console.log("s2", totalAmount);
        
      }
    }

    productInfo.OrderStatus = "Cancelled";
    productInfo.updatedAt = Date.now();
    // order.totalAmount -= totalAmount;
    
    // Update product and order information
    await Promise.all([
      order.save(),
      Product.findByIdAndUpdate({ _id: productId }, { $inc: { quantity: productInfo.quantity } }),
    ]);

    // ========== adding money to wallet =========
    if (productInfo.paymentStatus === 'Success') {
      const walletHistory = {
        transactionDate: new Date(),
        transactionDetails: 'Refund',
        transactionType: 'Credit',
        transactionAmount: totalAmount,
        currentBalance: !isNaN(userId.wallet) ? userId.wallet + totalAmount : totalAmount,
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
    console.error(error.message);
    res.status(500).json({ message: "Internal server error." });
  }
};




// =========== admin side order status managment ============
const changeOrderStatus = async (req, res) => {
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
    // console.log(productInfo);
    productInfo.OrderStatus = status;
    productInfo.StatusLevel = statusLevel;
    productInfo.updatedAt = Date.now();

    if(status==="Delivered")
    productInfo. paymentStatus ="Success";

    const result = await order.save();

    if(status==="Delivered"){

      let analaticResult = await CreateOrderAnalatic();
      // console.log('RETURN RESULT',analaticResult);
    }


    res.redirect(
      `/admin/order/orderManagment?orderId=${orderId}&productId=${productId}`
    );
  } catch (error) {
    console.log(error.message);
  }
};


             
// ======== order analatical creation =========
const CreateOrderAnalatic = async () => {
 
  try {

    const orderDataData = await Order.aggregate([
      {
        $match: { "products.OrderStatus": "Delivered" }
      },
      {
        $unwind: "$products"
      },
      {
        $match: { "products.OrderStatus": "Delivered" }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'products.productId',
          foreignField: '_id',
          as: 'populatedProduct'
        }
      },
      {
        $unwind: '$populatedProduct'
      },
      {
        $group: {
          _id: '$populatedProduct._id',
          productName: { $first: '$populatedProduct.productName' },
          totalSalesAmount: { $sum: { $multiply: [{$toDouble: '$populatedProduct.price'}, '$products.quantity'] } }
        }
      }
    ]);

    // Calculate total sales amount from the aggregated data
    const totalSalesAmount = orderDataData.reduce((total, result) => total + result.totalSalesAmount, 0);

    // Calculate total orders from the aggregated data
    const totalOrders = orderDataData.length;

    // Save the calculated values to the OrderAnalytics model
    let orderAnalytics = await Analytics.findOne();

    if (!orderAnalytics) {
      orderAnalytics = new Analytics({
        totalSalesAmount,
        totalOrders,
      });
    } else {
      orderAnalytics.totalSalesAmount = totalSalesAmount * 0.2;
      orderAnalytics.totalOrders = totalOrders;
    }

    let result = await orderAnalytics.save();
    
    return result;
  } catch (error) {
    console.log(error.message);
  }
};



// ========= admin cancel order ==========
const adminCancelOrder = async (req, res) => {
  
  try {
    const { orderId, productId } = req.body;

    const order = await Order.findById(orderId).populate(
      "userId"
    );

    const userId =order.userId._id

    console.log(userId);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const productInfo = order.products.find(
      (product) => product.productId.toString() === productId
    );

    const productDetails = await Product.findById(productInfo.productId);

    const totalAmount = productInfo.quantity* productDetails.price

    if (productInfo) {
      productInfo.OrderStatus = "Cancelled";
      productInfo.updatedAt = Date.now();
      // order.totalAmount -= totalAmount

      await order.save();

      await Product.findByIdAndUpdate(
        { _id: productId },
        {
          $inc: { quantity: productInfo.quantity },
        }
      );

      // ========== adding money to wallet =========
      if(productInfo.paymentStatus==='Success'){
        
        const walletHistory = {
          transactionDate: new Date(),
          transactionDetails: 'Refund',
          transactionType: 'Credit',
          transactionAmount: totalAmount,
           currentBalance: !isNaN(userId.wallet) ? userId.wallet + amount : totalAmount
         }
          await User.findByIdAndUpdate(
              {_id: userId },
              {
                  $inc:{
                      wallet: totalAmount
                  },
                  $push:{
                      walletHistory
                  }
              }
          );
  
      }

      if(productInfo.paymentStatus==='Success'){
        
        productInfo.paymentStatus= "Refund";
        const result = await order.save();
      }

      return res.json({ cancel: 1, message: "Order successfully cancelled" });
    } else {
      return res
        .status(404)
        .json({ message: "Product not found in the order." });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "An error occurred" });
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
};
