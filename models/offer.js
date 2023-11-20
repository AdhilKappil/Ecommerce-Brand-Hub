
const mongoose = require( 'mongoose' ) 

const Schema = mongoose.Schema

const offerSchema = Schema({
    name : {
        type : String,
        required : true
    },

    startingDate : {
        type : Date,
        required : true
    },

    expiryDate : {
        type : Date,
        required : true
    },

    discount : {
        type : Number,
        required : true
    },
    status : {
        type : Boolean, 
        default : true
    }

})

module.exports = mongoose.model('offer', offerSchema )