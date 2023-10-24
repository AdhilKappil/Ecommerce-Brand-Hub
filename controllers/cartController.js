const mongoose = require("mongoose");
const Cart = require('../models/cart');
const Product = require('../models/product');
const User = require('../models/users');



// ========== rendering cart page ==========
// const loadCart = async (req, res, next) => {
//     try {
//         const user_id = req.session.user_id
//         const userData = await User.findOne({ email: email });
//         let cartData = await Cart.findOne({ user: userData._id }).populate('products.productId');
//         let totalPrice = 0;
//         // dPrice = 0, subtotalPrice = 0;
//         let cartList = [];
//         req.session.cartCount = 0
//         if (cartData && cartData.products) {
//             req.session.cartCount = cartData.products.length
//         }
//         if (cartData && cartData.products.length > 0) {
//             cartList = cartData.products.map(({ productId, quantity, cartPrice}) => ({
//                 productId,
//                 // size,
//                 quantity,
//                 cartPrice
//                 // cartDPrice,
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
    // loadCart,
    addToCart 

}    