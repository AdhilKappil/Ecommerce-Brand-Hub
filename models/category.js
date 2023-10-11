const mongoose = require("mongoose");

const adminSchema =  new mongoose.Schema({

    name:{
        type:String,
        required:true
    },

    description:{
        type:String,
        required:true
    },

    isListed:{
        type:Boolean,
        required:true,
        
    }

  
})

module.exports = mongoose.model('category',adminSchema);