const mongoose = require('mongoose');
const cartSchema = new mongoose.Schema({
    user: {
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:true
      },
      products:[
        {
          productId: {
            type:mongoose.Schema.Types.ObjectId,
            ref:'product',
            required: true
          },
          quantity : {
            type: Number,
            default:1,
            min:1,
            max:5
          }
        }
      ]
    },
    {
      timestamps:true
    })

module.exports = mongoose.model('cart', cartSchema);