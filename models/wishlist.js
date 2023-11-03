
const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user", // Reference the User model
    required: true
  },
  products:[ {
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
    required: true,
  }]
});

module.exports = mongoose.model("wishlist", wishlistSchema)