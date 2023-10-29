const mongoose = require("mongoose");
const Cart = require('../models/cart');
const Product = require('../models/product');
const User = require('../models/users');
const Address = require('../models/userAddress');




// ======== loading chekout page =========
// const loadCheckout = async(req,res)=>{
//     try {

//         const id = req.session.user_id;
//         const UserData=await User.findById(id)
//         const products = await Cart.findOne({ user:id }).populate(
//             "products.productId"
//         );
//         console.log(products);
//         const address = await Address.findOne({ userId:id },{address:1})
    
//         if(products)
//         {
//         if(address)
//         {
//         res.render('checkout', { products, address,UserData,user:req.session.user_id})
//         }else{
//             res.render('checkout',{
//                 UserData,
//                 products,
//                 address:0,
//                 user:req.session.user_id

//             })
//         }
//     }else{
//         console.log('sbh');
//         res.redirect('/viewCart')
//     }

//     } catch (err) {
//        console.log(err);
//     }
// }




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
          select: "productName",
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
          });
        } else {
          return res.render("checkout", {
            user: req.session.user_id,
            total,
            address: 0,
          });
        }
      } else {
        return res.redirect("/cart");
      }
    } catch (error) {
      console.log(error.message);
    }
  };


module.exports = {
 
    loadCheckout
    
    
};
 