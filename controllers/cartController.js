const mongoose = require("mongoose");
const Cart = require('../models/cart');
const Product = require('../models/product');
const User = require('../models/users');



// ========== rendering cart page ==========
// const loadCart = async (req, res, next) => {
//     try {
//         // const userId = req.session.user_id
//         const email = req.session.user.email;
//         const userData = await User.findOne({ email: email });
//         const cartData = await Cart.findOne({ user: userData._id }).populate('products.productId');
//         const totalPrice = 0, cartTPrice = 0;
//         let cartList = [];
//         req.session.cartCount = 0
//         if (cartData && cartData.products) {
//             req.session.cartCount = cartData.products.length
//         }
//         if (cartData && cartData.products.length > 0) {
//             cartList = cartData.products.map(({ productId, quantity, cartPrice}) => ({
//                 productId,
//                 quantity,
//                 cartPrice,
//                 cartTPrice
//                 // size,
//                 // cartSubtotalPrice
//             }));
//             // console.log(cartList.length);
//             for (const { productId, quantity } of cartList) {
//                 await Cart.updateOne(
//                     { user: userData._id, 'products.productId': productId },
//                     {
//                         $set: {
//                             'products.$.cartPrice': quantity * productId.price,
//                             // 'products.$.cartDPrice': quantity * productId.discountPrice,
//                             // 'products.$.cartSubtotalPrice': quantity * productId.price + productId.discountPrice
//                         }
//                     }
//                 );
//             }
//             // Fetch updated cart data after the updates
//             cartData = await Cart.findOne({ user: userData._id }).populate('products.productId');
//             cartList = cartData.products.map(({ productId, quantity, cartPrice}) => ({
//                 productId,
//                 // size,
//                 quantity,
//                 cartPrice
//                 // cartDPrice,
//                 // cartSubtotalPrice
//             }));
//             totalPrice = cartList.reduce((acc, curr) => acc + curr.cartPrice, 0);
//             // dPrice = cartList.reduce((acc, curr) => acc + curr.cartDPrice, 0);
//             // subtotalPrice = cartList.reduce((acc, curr) => acc + curr.cartSubtotalPrice, 0);
//             await Cart.updateOne({ user: userData._id }, { $set: { totalPrice: totalPrice } });
//         }
//         res.render('cart', { user: userData, title: 'Cart',  totalPrice, cartData: cartList, cartCount: req.session.cartCount });
//     } catch (error) {
//         next(error);
//     }
// };



// ======== this function use to collect user Data =======
const takeUserData = async (userId) => {
  try {
    return new Promise((resolve, reject) => {
      User.findOne({ _id: userId }).then((response) => {
        resolve(response);
      });
    });
  } catch (error) {
    console.log(error.message);
  }
};



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



// ========== rendering cart page ==========
const  loadCart  = async (req, res) => {
  try {
    const userData = await takeUserData(req.session.user_id);
    const cartDetails = await Cart.findOne({ user: req.session.user_id })
      .populate({
        path: "products.productId",
        select: "productName price images",
      })
      .exec();

    if (cartDetails) {

      let total = await calculateTotalPrice(req.session.user_id);
      
      return res.render("cart", {
        user: userData,
        cartItems: cartDetails,
        total,
      });
    } else {
      return res.render("cart", { user: userData, cartItems: 0, total: 0 });
    }
  } catch (error) {
    console.log(error.message);
  }
};



// ========= adding items to cart =========
const addToCart = async (req, res) => {
        try {
          const existingCart = await Cart.findOne({user:req.body.user});
          if (!existingCart){
            const cart = new Cart({
              user:req.body.user,
              products:[
                {
                  productId:req.body.id,
                  quantity:1
                }
              ]      
            })
            const result= await cart.save();
            res.json({cart:1});
      
          }else{
            const productInCart = existingCart.products.find(
              (item)=>item.productId.toString()===req.body.id.toString()
            );
      
            if(productInCart) {
              res.json({cart:2})
      
            }else {
              existingCart.products.push({
                productId:req.body.id,
                quantity :1
              })
              res.json({cart:1})
            }
            const result = await existingCart.save()
          }
        } catch (error) {
          console.log(error);
        }
      }



module.exports = {
    loadCart,
    addToCart 

}    