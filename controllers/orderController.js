const mongoose = require("mongoose");
const Cart = require('../models/cart');
const Product = require('../models/product');
const User = require('../models/users');
const Address = require('../models/userAddress');




// ======== loading chekout page =========
const loadCheckout = async(req,res)=>{
    try {

        const id = req.session.user_id;
        const UserData=await User.findById(id)
        const products = await Cart.findOne({ user:id }).populate(
            "products.productId"
        );
        console.log(products);
        const address = await Address.findOne({ userId:id },{address:1})
    
        if(products)
        {
        if(address)
        {
        res.render('checkout', { products, address,UserData,user:req.session.user_id})
        }else{
            res.render('checkout',{
                UserData,
                products,
                address:0,
                user:req.session.user_id

            })
        }
    }else{
        console.log('sbh');
        res.redirect('/viewCart')
    }

    } catch (err) {
       console.log(err);
    }
}




module.exports = {
 
    loadCheckout
    
    
};
 