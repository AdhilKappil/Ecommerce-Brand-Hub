
const admin = require('../models/admin');
const category = require('../models/category');
const bcrypt = require("bcrypt");


// ======== pasword security =========
const securePassword = async(password)=>{

    try {
        
        const passwordHash = await bcrypt.hash(password,10);
        return passwordHash;

    } catch (error) {
        console.log(error.message);
    }
}


//======= admin login page =======   
const loadLogin = async(req,res)=>{

    try {
        res.render('adminLogin'); 

    } catch (error) {
        console.log(error.message); 
    }
}

//========= loading  Dashboard ========
const verifyLogin = async(req,res) => {

    try {
  
      const email = req.body.email;
      const password = req.body.password;
  
      const adminData = await admin.findOne({ email:email })
      
      if(adminData){
  
        const passwordMatch = await bcrypt.compare(password,adminData.password);
  
        if(passwordMatch){              
            res.render('dashboard');
          }else{
            res.render('adminLogin',{message:"Login details are incorrect" });
          }
  
        }else{
          res.render('adminLogin',{message:"Login details are incorrect" });
        }
  
    }catch(error){
      console.log(error);
    }
  }
  
//====== loading add catogory page =======
const loadAddCategories = async(req,res)=>{

  try {
      res.render('addCategories'); 

  } catch (error) {
      console.log(error.message); 
  }
}

//======== insert category ===========
const insertCategory = async (req,res)=>{
  try {

    const Category = await new category({
      name:req.body.category_name,
      description:req.body.category_description,
      isListed:true
    })

    const result = await Category.save()
    res.redirect('/admin/addCategories')
  } catch (error) {
    console.log(error);
  }
}

// ======== Rendering view categories ======== 
const loadViewCategory = async (req, res) => {
  try {
    const categories = await category.find(); // Assuming you want to retrieve all categories from the database
    res.render('viewCategories', { category: categories });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

// ========== list and unlist ===========
const unlistCategory = async (req, res) => {
  try {
    
    const id = req.query.id;
    const Category = await category.findById(id);
    
    if (Category) {
      Category.isListed = !Category.isListed;
      await Category.save();
      
    }

    const categories = await category.find();
    
    res.render('viewCategories', { category: categories });
  } catch (error) {
    console.log(error);
  }
};

// ======== loading edit cotegory =========
const loadEditCatogories = async (req, res) => {
  try {
    const id = req.query.id;
    console.log("ID:", id);

    const Category = await category.findById(id);
    console.log(Category);

    if (Category) {
      res.render('editCategories', { data: Category }); // Pass the category object to the template
    } else {
      res.redirect('/admin/viewCategories');
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
}


/// ==========Editing Category==========
const editCategory = async(req,res) => {

  try{

    const editData = await category.findByIdAndUpdate({ _id:req.body.id },{$set:{ name:req.body.name, description:req.body.description}});

    res.redirect('/admin/viewCategories');

  }catch(error){
    console.log(error.message);
  }
}





module.exports = {
    loadLogin,
    verifyLogin,
    loadAddCategories,
    insertCategory,
    loadViewCategory,
    unlistCategory,
    editCategory,
    loadEditCatogories
}