
const User = require('../models/users');
const Razorpay = require("razorpay");
const crypto = require("crypto");



// =========== razorpay instance ===========
var instance = new Razorpay({
  key_id: process.env.razorpaykey_id,
  key_secret: process.env.razorpaykey_secret,
});



// ========= loading wallet ========= 
const loadWallet = async(req,res)=>{
    try{
    const user = req.session.user_id
    const userData = await User.findOne({_id:user})
    console.log("userData id :",userData);

    res.render('wallet',{user,userData})

  }catch(error){
    console.log(error);
  }
}




const addMoneyToWallet = async(req,res)=>{
  try{

    console.log("entered add money to wallet");
     
    const {amount} = req.body
    const  id = crypto.randomBytes(8).toString('hex')

    var options = {
      amount: amount*100,
      currency:'INR',
      receipt: ""+id
  }


  instance.orders.create(options, (err, order) => {
    console.log("oreder is :",order);
    if(err){
        res.json({status: false})
    }else{
        res.json({ status: true, payment:order })
    }

})



  }catch(error){
    console.log(error);
  }

}



// verifying and adding wallet deatailes to DB
const verifyWalletPayment = async(req,res)=>{
  try{

    console.log("entered into post verify wallet payment");


    const userId = req.session.user_id

    const details = req.body;
    const amount = parseInt(details.order.amount)/100
        let hmac = crypto.createHmac('sha256',instance.key_secret)


        hmac.update(
          details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id
      )
      hmac = hmac.digest('hex')
      if(hmac == details.payment.razorpay_signature){
          
        const walletHistory = {
          transactionDate: new Date(),
          transactionDetails: 'Deposited via Razorpay',
          transactionType: 'Credit',
          transactionAmount: amount,
          currentBalance: !isNaN(userId.wallet) ? userId.wallet + amount : amount
      }
          await User.findByIdAndUpdate(
              {_id: userId},
              {
                  $inc:{
                      wallet: amount
                  },
                  $push:{
                      walletHistory
                  }
              }
          );
          console.log('udddd')
          res.json({status: true})
      }else{
          res.json({status: false})
      }


  }catch(error){
    console.log(error);
  }
}



module.exports = {
   
    loadWallet,
    addMoneyToWallet,
    verifyWalletPayment
    
};
