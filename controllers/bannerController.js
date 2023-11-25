
const Banner=require('../models/banner');



// ======= loading add banner =======
const loadAddBanner =async (req,res)=>{
   
    try {
        res.render('addBanner')
    } catch (error) {
        console.log(error);
  }
}



// ========== adding banner ==========
const insertBanner =async (req,res)=>{
    
    try {
        const image=req.file.filename
        const title=req.body.title
        const description=req.body.description
        let banner = new Banner({
            title: title,
            description: description,
            image:image,
            status: true
          });
      
          let result = await banner.save();
          res.render('addBanner')
       
    } catch (error) {
        console.log(error);
        res.status(500).render('error-500')
    }
}



// ========= rendering the banner page =========
const loadBanner =async (req,res)=>{
    
    try {
     const banner=await Banner.find()

        res.render('banner',{banner:banner})
    } catch (error) {
        console.log(error);
        res.status(500).render('error-500')
    }
}



// ========= block or unblock banner =========
const blockBanner = async(req,res)=>{
    try {
    const id=req.query.id
    

    const banner = await Banner.findOne({_id:id})
    if(banner.status == true){
        await Banner.updateOne({_id:id},{$set:{status: false}})
    }else{
        await Banner.updateOne({_id:id},{$set:{status: true}})
    }
    if(banner){
        res.redirect('/admin/banner')
    }else{
        console.console.log('not get');
    }
    } catch (error) {
        console.log(error);
        res.status(500).render('error-500')
    }
}



// ========= edit banner ========
const editBanner = async (req,res)=>{
    try {

        const bannerId = req.query.id
        const banner = await Banner.findOne({_id:bannerId})
        res.render('editBanner',{banner:banner})
    } catch (error) {
        console.log(error);
        res.status(500).render('error-500')
    }
}



// =========== updating banner =========
const updateBanner =async (req,res)=>{
    
    try {
        const updated = await Banner.updateOne({_id:req.query.id},{$set:{
            title: req.body.title,
            description: req.body.description,
            image:req.file.filename
        }})
        if(updated){
            res.redirect('/admin/banner')
        }else{
            console.log('not updated');
        }
    } catch (error) {
        console.log(error);
        res.status(500).render('error-500')
    }
}




module.exports = {
    loadAddBanner,
    insertBanner,
    loadBanner,
    blockBanner,
    editBanner,
    updateBanner

  };