const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  discountPercentage: {
    type: Number,
    required: true,
  },
  user: {
    type: Array,
    ref: 'user',
  },
  startDate: {
    type: Date,
    required: true,
  },
  expireDate: {
    type: Date,
    required: true,
  },
  minimumSpend: {
    type: Number, 
    required: true,
  },
});

module.exports = mongoose.model('coupon', couponSchema);