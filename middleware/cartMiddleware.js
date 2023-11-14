

const User=require('../models/users')
const Cart=require('../models/cart')

const cartMiddleware=async (req,res,next)=>{
    try {
        if(req.session.user_id){
        const user=req.session.user_id
        const userData= await User.findById({_id:user})

        if (!userData) {
           
            return res.redirect('/login');
          }
        // const userId=userData._id

        const cart=await Cart.findOne({user:user})
        const count = cart ? cart.products.length : 0;
        res.locals.count= count
        next()
        }else{
            const count=0
            res.locals.count= count
            next()
        }

    } catch (error) {
        console.log(error);
    }  
}
module.exports = cartMiddleware;