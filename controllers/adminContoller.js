
const admin = require('../models/admin');
const User = require('../models/users');
const category = require('../models/category');
const product = require('../models/product');
const productDb = require('../models/product')
const Order = require("../models/order");
const bcrypt = require("bcrypt");
const path = require('path')
const fs = require("fs")
const { ObjectId}=require('mongodb')


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
            res.redirect('/admin/dashboard');
        
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

    let users = await User.find({});;
    // console.log(users);
    const TransactionHistory = await Order.find();
    // console.log('history',TransactionHistory);
    const countOfCod = await Order.countDocuments({
      paymentMethod: "COD",
    });
  
    const countOfOnline = await Order.countDocuments({
      paymentMethod: "Online Payment",
    });
    const countOfWallet = await Order.countDocuments({
      paymentMethod: "Wallet",
    });



    const paymentChart = { countOfCod, countOfOnline, countOfWallet};
    // console.log('chart',paymentChart);
    const orders = await recentOrder();
    const stock = await getTotalStockNumber();
    // console.log("orders",orders);
    // console.log('stock',stock);
    const result = await createSalesReport("year")
    console.log('result',result);
    const report = {
      stock,
      sales: result.productProfits.length,
      amount: result.totalSales,
    };

    // console.log("report",report);
    
    res.render("dashboard", {
      users: users,
      paymentHistory: TransactionHistory,
      orders,
      paymentChart,
      report,
    });
  } catch (error) {
    console.log(error.message);
  }
};



// ======= fiding recent order =========
const recentOrder = async () => {
  try {
    const orders = await Order.find();
    // console.log('my orders',orders);

    const productWiseOrdersArray = [];

    for (const order of orders) {
      for (const productInfo of order.products) {
        const productId = productInfo.productId;
        // console.log("id",productId );

       const product = await productDb.findById(productId).select(
          "productName images price"
        );
        // console.log("produc",product);
        const userDetails = await User.findById(order.userId).select(
          "email"
        );
        // console.log("user",userDetails);
        if (product) {
          // Push the order details with product details into the array
          orderDate = await formatDate(order.orderDate);
          productWiseOrdersArray.push({
            user: userDetails,
            product: product,
            orderDetails: {
              _id: order._id,
              userId: order.userId,
              shippingAddress: order.shippingAddress,
              orderDate: orderDate,
              totalAmount: productInfo.quantity * product.price,
              OrderStatus: productInfo.OrderStatus,
              StatusLevel: productInfo.StatusLevel,
              paymentMethod: order.paymentMethod,
              paymentStatus: productInfo.paymentStatus,
              quantity: productInfo.quantity,
            },
          });
        }  
      }
    }

    // for(i=0;i<productWiseOrdersArray.length;i++){
    return productWiseOrdersArray;
  } catch (error) {}
};



//======== findimng totel Stock number
const getTotalStockNumber = async () => {
  try {
    const result = await product.aggregate([
      {
        $group: {
          _id: null,
          totalStock: { $sum: "$quantity" },
        },
      },
    ]);
    const totalStock = result.length > 0 ? result[0].totalStock : 0;
    // console.log("totelstock",totalStock);
    return totalStock;
  } catch (error) {
    console.log(error.message);
  }
}



// ========= genarating sales report ==========
const genarateSalesReports = async (req, res) => {
  try {
    const date = Date.now();    
    // const report = await generateReport(req.body.data);
    const result = await createSalesReport(req.body.data)
    const report = {
        reportDate: date,
        totalSalesAmount: result.totalSales,
        totalOrders: result.productProfits.length,
      };
      // console.log(report);

    // const fileName = `salesReport-${date}.xlsx`; // Provide the desired file name

    // const exel = await generateExcelReport(reportData,fileName);
    res.status(200).json({report});
    // res.json(report,exel);
  } catch (error) {
    console.log(error.message);
  }
};



// ========== creating sales report ==========
const createSalesReport = async (interval) => {
  try {
    let startDate, endDate;

    if (interval === "day") {
      const today = new Date();
      startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0); // Start of the day
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999); // End of the day
    } else {
      startDate = getStartDate(interval);
      endDate = getEndDate(interval);
    }

    // findig order date in between start date and end date
    const orders = await Order.find({
      orderDate: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    const transformedTotalStockSold = {};
    const transformedProductProfits = {};

    const getProductDetails = async (productId) => {
      return await product.findById(productId);
    };

    for (const order of orders) {
      for (const productInfo of order.products) {
        const productId = productInfo.productId;
        const quantity = productInfo.quantity;

        const product = await getProductDetails(productId);
        const productName = product.productName;
        const image = product.images[0];
        // const shape = product.frame_shape;
        const price = product.price;

        if (!transformedTotalStockSold[productId]) {
          transformedTotalStockSold[productId] = {
            id: productId,
            name: productName,
            quantity: 0,
            image: image,
            // shape: shape,
          };
        }
        transformedTotalStockSold[productId].quantity += quantity;

        if (!transformedProductProfits[productId]) {
          transformedProductProfits[productId] = {
            id: productId,
            name: productName,
            profit: 0,
            image: image,
            // shape: shape,
            price: price,
          };
        }
        const productPrice = product.price;
        const productCost = productPrice * 0.5;
        const productProfit = (productPrice - productCost) * quantity;
        transformedProductProfits[productId].profit += productProfit;
      }
    }

    const totalStockSoldArray = Object.values(transformedTotalStockSold);
    const productProfitsArray = Object.values(transformedProductProfits);

    const totalSales = productProfitsArray.reduce(
      (total, product) => total + product.profit,
      0
    );

    const salesReport = {
      totalSales,
      totalStockSold: totalStockSoldArray,
      productProfits: productProfitsArray,
    };

    return salesReport;
  } catch (error) {
    console.error("Error generating the sales report:", error.message);
  }
};



// ======== This Function used to formmate date from new Date() function ====
function formatDate(date) {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}



// ===== setting start date and end date ========
const getStartDate = (interval) => {
  const start = new Date();
  if (interval === "week") {
    start.setDate(start.getDate() - start.getDay()); // Start of the week
  } else if (interval === "year") {
    start.setMonth(0, 1); // Start of the year
  }
  return start;
};

const getEndDate = (interval) => {
  const end = new Date();
  if (interval === "week") {
    end.setDate(end.getDate() - end.getDay() + 6); // End of the week
  } else if (interval === "year") {
    end.setMonth(11, 31); // End of the year
  }
  return end;
};


  
//====== loading add catogory page =======
const loadAddCategories = async(req,res)=>{

  try {
      res.render('addCategories'); 

  } catch (error) {
      console.log(error.message); 
  }
}

//======== insert category ===========
// const insertCategory = async (req,res)=>{
//   try {

//     const data = await new category({
//       name:req.body.category_name,
//       description:req.body.category_description,
//       isListed:true
//     })
    
//     const result = await data.save()
//     res.redirect('/admin/addCategories')
//   } catch (error) {
//     console.log(error);
//   }
// }

const insertCategory= async (req,res)=>{
  try {
    const categoryname=req.body.category_name
      const already=await category.findOne({name:{$regex:categoryname,'$options':'i'}})
      if(already){
          res.render('addCategories',{message : "Category Already Created"})
      }else{

    const data = await new category({
      name:req.body.category_name,
      description:req.body.category_description,
      isListed:true
    })
    
    const result = await data.save()
    
    res.redirect('/admin/addCategories')
  }} catch (error) {
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
    res.status(500).render('error-500');
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
    res.status(500).render('error-500');
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
    res.status(500).render('error-500');
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

        if (req.session.user_id === id) { 
          req.session.user_id = null;
        }
      }
  
      const Users = await User.find();
 
      res.redirect('/admin/users');

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
      res.status(500).render('error-500');
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
    res.status(500).render('error-500');
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
    res.status(500).render('error-500');
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
    res.status(500).render('error-500');
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
    res.status(500).render('error-500');
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
 


// ========== rendering 404 error page =========
const  load404 = async(req,res)=>{

  try{
      
      res.render('error-404')
  }
  catch (error)
      {
          console.log(error.message)
     }
}




// ========== rendering 500 error page =========
const  load500 = async(req,res)=>{

  try{
      
      res.render('error-500')
  }
  catch (error)
      {
          console.log(error.message)
     }
}



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
    load404,
    load500,
    genarateSalesReports
    // loadBaner
}