const mongoose = require("mongoose");
const Cart = require('../models/cart');
const Product = require('../models/product');
const User = require('../models/users');
const Address = require('../models/userAddress');
const Order = require('../models/order');




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
            products:cartDetails.products
          });
        } else {
          return res.render("checkout", {
            user: req.session.user_id,
            total,
            address: 0,
            products:cartDetails.products
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
const addShippingAddress = async(req,res)=>{
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
    
    
    res.redirect('/checkout');
  } catch (error) {
    console.log(error.message);
  }
};



//genarate Order uniq Id
// --------------------------
const generateUniqueTrackId = async()=>{
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
}



// =========== place order ===========
const placeOrder = async (req, res) => {

  try {
    
    const addressId = req.body.address;
    const paymentType = req.body.payment;
    const cartDetails = await Cart.findOne({ user: req.session.user_id });

    const userAddrs = await Address.findOne({ userId: req.session.user_id });
    const shipAddress = userAddrs.address.find((address) => {
      return address._id.toString() === addressId.toString();
    });

    if (!shipAddress) {
      return res.status(400).json({ error: "Address not found" });
    }

    const { fullName, mobile, state,district, city,pincode, } =
      shipAddress;
   

    const cartProducts = cartDetails.products.map((productItem) => ({
      productId: productItem.productId,
      quantity: productItem.quantity,
      OrderStatus: "Placed",
      StatusLevel: 1,
      paymentStatus: "Pending",
      "returnOrderStatus.status":"none",
      "returnOrderStatus.reason":"none"
      
    }));

    const total = await calculateTotalPrice(req.session.user_id);

    const today = new Date();
      const deliveryDate = new Date(today);
      deliveryDate.setDate(today.getDate() + 7);
   
    const trackId = await generateUniqueTrackId()
    const order = new Order({
      userId: req.session.user_id,
      "shippingAddress.fullName": fullName,
      "shippingAddress.mobile": mobile,
      "shippingAddress.state":state ,
      "shippingAddress.district": district,
      "shippingAddress.city": city,
      "shippingAddress.pincode": pincode,
      products: cartProducts,
      totalAmount: total,
      paymentMethod: paymentType,
      expectedDelivery:deliveryDate,
      orderDate:new Date(),
      trackId,
    });

    
    const placeorder = await order.save();

    if (paymentType === 'COD') {
      for (const item of cartDetails.products) {
        const productId = item.productId._id;
        const quantity = parseInt(item.quantity, 10);

        await Product.findByIdAndUpdate({_id:productId}, {
          $inc: { quantity: -quantity },
        });
      }
    }

    await Cart.findOneAndDelete({userid:req.body.user_id}) 
 
    res.status(200).json({ placeorder, message: "Order placed successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "An error occurred" });
  }
};




// =========== rendering order page ============
const loadOrderPage = async(req,res)=>{

  try{

    const userId = req.session.user_id
    const cart = await Cart.findOne({user:userId})
    const userData = await User.findById({_id:userId})
    let cartCount=0; 


    if(cart){
      cartCount = cart.products.lenght
    }

    const orderData = await Order.find({userId:userId}).sort({date:-1})

    res.render('orders',{user:userData,orders:orderData,cartCount})


  }catch(error){
    console.log(error);
  }
}



// ========= rendering order details page ==========
const loadOrderDetailes = async (req, res, next) => {
  try {

      const userId = req.session.user_id;
      const orderId = req.query.id;

      let order; // Declare order variable outside the if-else block

      if (orderId) {
          order = await Order.findOne({ _id: orderId })
              .populate({
                  path: 'products.productId',
              })
              .sort({ orderDate: -1 });
      } else {
          order = await Order.findOne({ userId: userId })
              .populate({
                  path: 'products.productId',
              })
              .sort({ orderDate: -1 });
      }

      const products = await Cart.findOne({ user: userId }).populate('products.productId');

      if (!order) {
          return res.status(404).json({
              success: false,
              message: 'No orders found for the user.',
          });
      }

      res.render('orderDetails', { order, products, user: req.session.user_id });
  } catch (err) {
      next(err);
  }
};



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
        const userDetails = await User.findById(order.userId).select(
          "email"
        );
        // console.log(userDetails);
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
              paymentStatus:productInfo.paymentStatus,
              paymentMethod: order.paymentMethod,
              quantity: productInfo.quantity,
            },
          });
        }
      }
    }
    // for(i=0;i<productWiseOrdersArray.length;i++){
    // console.log(productWiseOrdersArray);
    // }
    res.render("order", { orders: productWiseOrdersArray });
  } catch (error) {
    console.log(error.message);
  }
};



// ========= admin side managinge the order ==========
const orderMangeLoad = async (req, res) => {
  try {
    const { orderId, productId } = req.query;
    // console.log(orderId, productId);
    const order = await Order.findById(orderId);

    if (!order) {
      return res
        .status(404)
        .render('error-404');
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
    // console.log(productOrder);
    // console.log();
    res.render("orderManagment", { product: productOrder, orderId, productId });
  } catch (error) {
    console.log(error.message);
  }
};



// ========= user cancel order ========== 
// const cancelOrder = async (req, res) => {
//   try {
//     const userId = req.session.user_id;
//     const orderId = req.params.orderId;
//     const productId = req.params.productId;

//     // Find the order by orderId and user ID
//     const order = await Order.findOne({ _id: orderId, userId: userId });

//     if (!order) {
//       return res.status(404).json({ success: false, message: 'Order not found' });
//     }

//     let canCancel = true;

//     for (const product of order.products) {
    
//       if(product.productId._id.toString() === productId)
//       {
//         console.log(product.status)
//       if (product.status === 'Delivered' || product.status === 'Canceled') {
//         canCancel = false;
//         break; // Exit the loop if any product cannot be canceled
//       }
//     }
//     }

//     if (!canCancel) {
//       return res.status(400).json({ success: false, message: 'Order cannot be canceled' });
//     }

//     // Set the status of the product with the specified productId to 'Canceled' within the order
//     for (const product of order.products) {
//       if (product.productId._id.toString() === productId) {
//         product.status = 'Canceled';
//          // Save the product status
//         await Product.findByIdAndUpdate(product.productId._id, {
//           $inc: { quantity: product.quantity },
//         });
//       }
//     }

//     await order.save();

//     res.json({ success: true, message: 'Order has been canceled' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Failed to cancel the order'});
//   }
// };



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

    console.log(statusLevel);
    // find status levelend

    console.log(order);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Find the product within the order by its ID (using .toString() for comparison)
    const productInfo = order.products.find(
      (product) => product.productId.toString() === productId
    );
    console.log(productInfo);
    productInfo.OrderStatus = status;
    productInfo.StatusLevel = statusLevel;
    productInfo.updatedAt = Date.now();

    const result = await order.save();

    console.log(result);
    // console.log(req.body);
    res.redirect(
      `/admin/order/orderManagment?orderId=${orderId}&productId=${productId}`
    );
  } catch (error) {
    console.log(error.message);
  }
};




module.exports = {
 
    loadCheckout,
    addShippingAddress,
    placeOrder,
    loadOrderPage,
    loadOrderDetailes,
    loadAdminOrder,
    orderMangeLoad,
    // cancelOrder,
    changeOrderStatus
    
    
};
 