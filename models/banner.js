const mongoose = require('mongoose')

const bannerSchema = new mongoose.Schema({
    title:{
        type:String,
        required: true
    },
    description:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    position:{
        type:Number,
        required:true
    },
    status:{
        type:Boolean,
        default:true
    }
})

module.exports = mongoose.model("banner", bannerSchema)