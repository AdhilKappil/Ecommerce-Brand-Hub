
// const mongoose = require("mongoose");
// const Wishlist = require('../models/wishlist');
// const Product = require('../models/product');
// const User = require('../models/users');




// const loadWishlist = async (req, res) => {
//     try {
//         const user_id = req.session.user_id;
//         const userId = req.session.user_id 
//         const products1 = await Cart.findOne({user_id:userId}).populate('items.product_Id')

//         // Find the user's wishlist and populate the products
//         const wishlist = await Wishlist.find({ user_id }).populate('products');

//         if (wishlist.length === 0) {
//             // Wishlist is empty, return an empty array
//             res.render('wishlist3', { data: [] });
//             console.log(wishlist)
//         } else {
//             res.render('wishlist3', { data: wishlist ,products:products1,userIsLoggedIn: req.session.user_id ? true : false});
//         }
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Internal server error');
//     }
// };



// ========== add wishlist ===========
// const addWishlist = async (req, res) => {
//     console.log('djh');
//     try {
//         const user_id = req.session.user_id;
//         const productId = req.query.id;
//         console.log(productId)
//         // Find the user's wishlist
//         const userWishlist = await Wishlist.findOne({ user_id });

//         if (userWishlist) {
//             // Check if the product is already in the wishlist
//             if (userWishlist.products.includes(productId)) {
//                 return res.json({ success: false, message: 'Product is already in the wishlist' });
//             }

//             // Add the product to the wishlist
//             userWishlist.products.push(productId);
//             await userWishlist.save();
//         } else {
//             // If the user doesn't have a wishlist, create one
//             const newWishlist = new Wishlist({
//                 user_id,
//                 products: [productId],
//             });
//             await newWishlist.save();
//         }

//         return res.json({ success: true, message: 'Product added to the wishlist successfully' });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ success: false, message: 'Internal server error' });
//     }
// };



// module.exports ={
//     // loadWishlist,
//     addWishlist
//     // removeFromWishlist
    
// }
