
const admin = require('../models/admin');
const User = require('../models/users');
const category = require('../models/category');
const product = require('../models/product');
const bcrypt = require("bcrypt");
const path = require('path')


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

    const data = await new category({
      name:req.body.category_name,
      description:req.body.category_description,
      isListed:true
    })

    const result = await data.save()
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

    const dataCategory = await category.findById(id);

    if (dataCategory) {
      res.render('editCategory', { data: dataCategory }); // Pass the category object to the template
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

    const editData = await category.findByIdAndUpdate({ _id:req.body.id },{$set:{ name:req.body.categoryname, description:req.body.categorydes}});

    res.redirect('/admin/viewCategories');

  }catch(error){
    console.log(error.message);
  }
}


// ======= loading user deatailes =======
const userLoad =  async (req, res) => {
  try {
    const user = await User.find(); 
    res.render('users', { users: user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
   }
  };


  // ====== block or un block user ======
  const blockUser = async (req, res) => {
    try {
      
      const id = req.query.id;
      const user = await User.findById(id);

      if (user) {
        user.isBlock = !user.isBlock 
        await user.save(); 
        
      }
  
      const Users = await User.find();
 
      res.render('users', { users: Users });

    } catch (error) {   
      console.log(error);
   }
  };


  // ======== loading add product page ==========
  const loadaddProducts = async (req, res) => {
    try {
      // Fetch categories from the database
      const categories = await category.find();
  
      // Render the addProducts.ejs template with the Category variable
      res.render('addProducts', { category: categories });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };


  // ========= add product ===========
  const addProduct = async(req,res)=>{
    try{

      const productname = req.body.productname;
      const category = req.body.category;
      const size = req.body.size
      const description = req.body.description;
      const price = req.body.price;
      const quantity = req.body.quantity;
      const image = req.file.filename;
  
      const newProduct = new product({
        productName:productname,
        category:category,
        size:size,
        description:description,
        price:price,
        image:image,
        quantity:quantity,
      })
      const productData = await newProduct.save();
      if(productData){
      res.redirect('/admin/addProduct');
      }else{
      res.render('addProduct',{message:"Something went wrong"});
      }

  }catch(error){
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}


// ====== load view products =======
const loadViewProducts = async(req,res) =>{

  try {
    const products = await product.find().populate("category"); // Populate the category field
    const categories = await category.find(); // Assuming you want to retrieve all categories from the database
    res.render('viewProducts', { product: products, category: categories });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}


// ======= load edit product ========
const loadeditProduct = async (req, res) => {
  try {
    const id = req.query.id;

    const dataproduct = await product.findById(id);

    if (dataproduct) {
      res.render('editProduct', { data: dataproduct }); 
    } else {
      res.redirect('/admin/viewProduct');
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
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
    loadEditCatogories,
    userLoad,
    blockUser,
    loadaddProducts,
    addProduct,
    loadViewProducts,
    loadeditProduct
}