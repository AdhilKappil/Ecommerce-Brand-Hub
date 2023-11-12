
const mongoose = require('mongoose');

const orderAnalyticsSchema = new mongoose.Schema({
  totalSalesAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  totalOrders: {
    type: Number,
    required: true,
    default: 0,
  }
});

const OrderAnalytics = mongoose.model('OrderAnalytics', orderAnalyticsSchema);

module.exports = OrderAnalytics;
