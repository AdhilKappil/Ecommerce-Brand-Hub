const mongoose = require("mongoose");

const userSchema =  new mongoose.Schema({

    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
   
    password:{
        type:String,
        required:true
    },

    isVerified:{
        type:Boolean,
        required:true
    },

    isBlock:{
        type:Boolean,
        required:true
    },

    token:{
        type:String,
        default:''
    },
    referralCode: {
        type: String,
        unique: true,

    },
    wallet: {
        type: Number,
        default: 0
    },
    
      walletHistory: [{

        transactionDate: {
            type: Date,
        },
        transactionDetails: {
            type: String
        },
        transactionType: {
            type: String
        },
        transactionAmount: {
            type: Number
        },
        currentBalance: {
            type: Number
        },
        orderId: {
            type: Number
        },
    }],
      
},
{
timestamps:true
}
)

module.exports = mongoose.model('user',userSchema);