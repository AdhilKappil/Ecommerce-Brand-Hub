const mongoose = require("mongoose");
const Offer = require("../models/offer")



// ======= loading the add product page =========
const loadAddOffer = async( req, res ) => {
    
    try {  
    res.render('addOffer')
    } catch (error) {
        console.log(error.message)
        res.redirect('/error-500')

    }
}




// ========== adding new offers =========
const addOffer = async ( req, res ) => {
    
    try {
        // const { search, page } = req.query
        const { startingDate, expiryDate, percentage } = req.body
        const name = req.body.name
        const offerExist = await Offer.findOne({ name : name })
        if( offerExist ) {
            res.render('addOffer',{message:'Offer already existing'})
        } else {
         const offer = new Offer({
            name : name,
            startingDate : startingDate, 
            expiryDate : expiryDate,
            discount : percentage,
            // search : search,
            // page : page
         }) 
         await offer.save()
         res.redirect('/admin/offer')
        }
    } catch (error) {
        console.log(error.message)
        res.redirect('/error-500')
    }
}



// ======= rendering the home page =======
const loadOffers = async( req, res ) => {
    try {
        const offers = await Offer.find()
        res.render('offer',{
            offers : offers,
            now : new Date()
        })
    } catch (error) {
        console.log(error.message)
        res.redirect('/error-500')

    }
}



// ======== rendering edit offer =========
const loadEditOffer = async ( req, res ) => {
    try {
        const id = req.params.id
        const offer = await Offer.findOne({ _id:id})
        res.render('editOffer',{
            offer : offer
        })
    } catch (error) {
        console.log(error.message)
        res.redirect('/error-500')

    }
}



// ======== updating edited data =======
const editOffer = async ( req, res ) => {
    
    try {
        const { id, name, startingDate, expiryDate, percentage } = req.body
        await Offer.updateOne({ _id : id }, {
            $set : {
                name : name,
                startingDate : startingDate,
                expiryDate : expiryDate,
                discount : percentage
            }
        })
        res.redirect('/admin/offer')
    } catch (error) {
        console.log(error.message)
        res.redirect('/error-500')

    }
}




module.exports = {
    loadAddOffer,
    addOffer,
    loadOffers,
    loadEditOffer,
    editOffer

  };