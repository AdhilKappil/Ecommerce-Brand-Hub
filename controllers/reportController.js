
const mongoose = require("mongoose");
const ProductDB = require("../models/product");
const User = require("../models/users");
const OrderDB = require("../models/order");



// ========== loading sales report page ==========
const salesReportPageLoad = async (req, res) => {
    try {
      let start, end;
  
      if (req.query.start && req.query.end) {
        start = req.query.start;
        end = new Date(req.query.end); // Convert to Date
        end.setDate(end.getDate() + 1); // Add one day to the end date
        console.log(end);
      } else {
        today = new Date();
        start = new Date(today);
        start.setDate(today.getDate() - 30);
        end = new Date(today); // Set end to one day after today
        end.setDate(today.getDate() + 1); // Add one day
        end = end.toISOString().split("T")[0];
      }
  
      const [sales, SoldProducts] = await Promise.all([
        createSalesReport(start, end),
        getMostSellingProducts(),
      ]);
      console.log("Debugger ====:"+sales,SoldProducts);
      if(sales === 0 ||SoldProducts==0 ){
        res.render("salesReport", {
          // week: WeeklySales,
          Mproducts: 0,
          sales:0,
        });
      }
      console.log(SoldProducts);
      res.render("salesReport", {
        // week: WeeklySales,
        Mproducts: SoldProducts,
        sales,
      });
    } catch (error) {
      console.error(error.message);
    }
};



// ========== creating sales report ==========
const createSalesReport = async (startDate, endDate) => {
    try {
      const orders = await OrderDB.find({
        orderDate: {
          $gte: startDate,
          $lte: endDate,
        },
      });
  
      if(!orders){
        return 0
      }
  
      const transformedTotalStockSold = {};
      const transformedProductProfits = {};
  
      const getProductDetails = async (productId) => {
        return await ProductDB.findById(productId);
      };
  
      for (const order of orders) {
        for (const productInfo of order.products) {
          const productId = productInfo.productId;
          const quantity = productInfo.quantity;
  
          const product = await getProductDetails(productId);
          const productName = product.productName;
          const image = product.images;
          const price = product.price;
  
          if (!transformedTotalStockSold[productId]) {
            transformedTotalStockSold[productId] = {
              id: productId,
              name: productName,
              quantity: 0,
              image: image,
              
            };
          }
          transformedTotalStockSold[productId].quantity += quantity;
  
          if (!transformedProductProfits[productId]) {
            transformedProductProfits[productId] = {
              id: productId,
              name: productName,
              profit: 0,
              image: image,
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




// ========= finding most selling products =========
 const getMostSellingProducts = async () => {
    try {
      const pipeline = [
        {
          $unwind: "$products", 
        },
        {
          $group: {
            _id: "$products.productId",
            count: { $sum: "$products.quantity" },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productData",
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 6, // Limit to the top 6 products
        },
      ];
  
      const mostSellingProducts = await OrderDB.aggregate(pipeline);
      if(!mostSellingProducts){
        return 0
      }
      console.log(mostSellingProducts[0].productData);
      return mostSellingProducts;
    } catch (error) {
      console.error("Error fetching most selling products:", error);
      return [];
    }
  };
  




 module.exports = {
    salesReportPageLoad,
    // generateExcelReports,
    // generatePDFReports,
    // portfolioFiltering,
  };




  