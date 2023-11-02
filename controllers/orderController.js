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
      StatusLevel: 1,
      paymentStatus: "pending",
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
      OrderStatus: "pending",
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




module.exports = {
 
    loadCheckout,
    addShippingAddress,
    placeOrder,
    loadOrderPage
    
    
};
 