
const admin = require('../models/admin');
const User = require('../models/users');
const category = require('../models/category');
const product = require('../models/product');
const bcrypt = require("bcrypt");
const path = require('path')
const fs = require("fs")


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
            req.session.admin_id=adminData._id              
            res.render('dashboard');
        
          }else{
            res.render('adminLogin',{message:"Email or password is incorrect" });
          }
  
        }else{
          res.render('adminLogin',{message:"Email or password is incorrect" });
        }
  
    }catch(error){
      console.log(error);
    }
  }


//======= admin dashboard rendering =======   
const loadadHome = async(req,res)=>{

  try {
      res.render('dashboard'); 

  } catch (error) {
      console.log(error.message); 
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
    
    res.redirect('/admin/viewCategories');
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
      const brand = req.body.brand;
      const category = req.body.category;
      const size = req.body.size
      const description = req.body.description;
      const price = req.body.price;
      const quantity = req.body.quantity;
      const images = []
      for(let i=0;i<req.files.length;i++)
      {
        images[i]=req.files[i].filename
      }
  
      const newProduct = new product({
        productName:productname,
        brand:brand,
        category:category,
        size:size,
        description:description,
        price:price,
        images:images,
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


// ======= load view products =======
const loadViewProducts = async (req, res) => {
  try {
    const products = await product.find().populate("category"); // Populate the category field
    const categories = await category.find(); // Assuming you want to retrieve all categories from the database
    res.render('viewProducts', { products: products, categories: categories }); // Pass 'products' and 'categories' to the template
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}



// ======= load edit product ========
const loadEditProduct = async (req, res) => {
  try {
    const id = req.query.id;

    const dataproduct = await product.findById(id);
    
    // Fetch categories from the database
    const categories = await category.find();

    if (dataproduct) {
      res.render('editProduct', { data: dataproduct, category: categories }); 
    } else {
      res.redirect('/admin/viewProduct');
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
}



// ======= updating edit product =======
const editProduct = async (req, res) => {
  try {
    const id = req.body.id;
    const productname = req.body.productname;
    const brand = req.body.brand;
    const category = req.body.category;
    const price = req.body.price;
    const quantity = req.body.quantity;
    const description = req.body.description;
    const size = req.body.size;

    // Check if there are new images
    const newImages = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        newImages.push(req.files[i].filename);
      }
    }

    // Find the existing product
    const existingProduct = await product.findById(id);

    if (existingProduct) {
      // Update the product details
      existingProduct.productName = productname; // Corrected variable name
      existingProduct.brand = brand;
      existingProduct.category = category; // Corrected variable name
      existingProduct.price = price;
      existingProduct.quantity = quantity;
      existingProduct.description = description;
      existingProduct.size = size;

      // Add new images, if any
      if (newImages.length > 0) {
        existingProduct.images = existingProduct.images.concat(newImages);
      }

      // Handle image deletion
      if (req.body.deleteImages) {
        console.log('Images to delete:', req.body.deleteImages); // Debugging
        // req.body.deleteImages should be an array of image filenames to delete
        for (const imageToDelete of req.body.deleteImages) {
          console.log('Deleting image:', imageToDelete); // Debugging
          // Remove the deleted image from the existing images
          existingProduct.images = existingProduct.images.filter(
            (image) => image !== imageToDelete
          );

          // Optionally, you can delete the image file from your storage here
          const imagePath = path.join(__dirname, '../static/adminAssets/images/products', imageToDelete);
          console.log('Deleting image file:', imagePath); // Debugging
          fs.unlink(imagePath, (err) => {
            if (err) {
              console.error('Error deleting file:', err);
            }
          });
        }
      }

      const updatedProduct = await existingProduct.save();

      if (updatedProduct) {
        res.redirect('/admin/viewProduct');
      } else {
        res.render('editProduct', { data: existingProduct, message: 'Failed to update the product' });
      }
    } else {
      res.redirect('/admin/viewProduct');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};



// ======= list and unlist product =======
const unlistProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const product1 = await product.findById(id);

    if (product1) {
      product1.status = !product1.status;
      await product1.save();
    }

    const products = await product.find().populate("category"); // Populate the category field
    const categories = await category.find(); // Assuming you want to retrieve all categories from the database

    res.redirect('/admin/viewProduct');
  } catch (error) {
    console.log(error);
  }
};



// ======== admin logout ==========
const adminLogout = async(req,res)=>{

  try{
      req.session.destroy()
      res.redirect('/admin')
  }
  catch (error)
      {
          console.log(error.message)
     }
}


// const loadBaner = async(req,res)=>{

//   try {
//       res.render('AddBaner'); 

//   } catch (error) {
//       console.log(error.message); 
//   }
// }
 




module.exports = {
    loadLogin,
    verifyLogin,
    loadadHome,
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
    loadEditProduct,
    editProduct,
    unlistProduct,
    adminLogout,
    // loadBaner
}