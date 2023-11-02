const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user', 
      required: true,
    },
    shippingAddress: {
        fullName: {
          type: String,
          required: true,
        },
        mobile: {
          type: Number,
          required: true,
        },
      state: {
        type: String,
        required: true,
      },
      city: {
          type: String,
          required: true,
        },
        district: {
          type: String,
          required: true,
        },
        pincode: {
          type: Number,
          required: true,
        },
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'product', 
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        // OrderStatus:{
        //   type:String,
        //   require:true
        // },
        StatusLevel:{
          type: Number,
          required: true
        },
        paymentStatus:{
          type:String,
          require:true
        },
        returnOrderStatus:{
          status:{
            type:String
          },
          reason:{
            type:String
          }
          
        },
        updatedAt:{
          type:Date,
          default:Date.now
        }
        
      }
    ],
    orderDate: {
      type: Date,
      default: Date.now,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod:{
      type:String,
      require:true
    },
    trackId:{
      type:Number,
      require:true
    },
    expectedDelivery:{
      type:Date,
      required:true
    },
    OrderStatus:{
      type:String,
      require:true
    },
  });

  module.exports = mongoose.model('order',orderSchema)