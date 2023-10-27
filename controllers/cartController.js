const mongoose = require("mongoose");
const Cart = require('../models/cart');
const Product = require('../models/product');
const User = require('../models/users');




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




// ========= increase the product stock ==========
const increaseStock = async(productId, quantity)=>{
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    product.stock += quantity;
    const result = await product.save();
    return result;
  } catch (error) {
    console.log(error.message);
  }
}


// =========== removing cart items ==========
const removeCart= async (req, res) => {
  try {
    const { user, product, qty } = req.body;
    const cart = await Cart.findOne({ user: user });
    const qtyFind = cart.products.find(item => item.productId.toString() == product.toString())
    await increaseStock(product,qtyFind.quantity)

    cart.products = cart.products.filter(
      (cartProduct) => cartProduct.productId.toString() !== product.toString()
    );
    const remove = await cart.save();
    console.log(remove);
    console.log("Porduct removed");
    res.json({ remove: 1 });
  } catch (error) {
    console.log(error.message);
  }
};



// ========== quantity management ============= 
const updateCart = async (req, res) => {
  try {
      const user = req.session.user_id;
      const productID = req.body.productID;
      const quantity = req.body.quantity;

      // Find the cart item with the specified product ID and user ID
      const updatedCartItem = await Cart.findOneAndUpdate(
        { 'products.productId': productID, user: user },
        { $set: { 'products.$.quantity': quantity } },
        { new: true }
      );
      
      // Send the updated cart item back to the client
      res.json(updatedCartItem);
  } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error');
  }
};



module.exports = {

    loadCart,
    addToCart,
    removeCart,
    updateCart

}    