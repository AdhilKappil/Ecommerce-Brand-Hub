const mongoose = require("mongoose");
const ProductDB = require("../models/product");
const User = require("../models/users");
const OrderDB = require("../models/order");
const ExcelJS = require("exceljs");
const puppeteer = require("puppeteer");



// ========== loading sales report page ==========
const salesReportPageLoad = async (req, res, next) => {
  try {
    let start, end;

    if (req.query.start && req.query.end) {
      start = req.query.start;
      end = new Date(req.query.end);
      end.setDate(end.getDate() + 1);
    } else {
      today = new Date();
      start = new Date(today);
      start.setDate(today.getDate() - 30);
      end = new Date(today);
      end.setDate(today.getDate() + 1);
      end = end.toISOString().split("T")[0];
    }

    const [sales, SoldProducts] = await Promise.all([
      createSalesReport(start, end),
      getMostSellingProducts(),
    ]);

    const allOrders = await getorders(start, end);

    if (sales === 0 || SoldProducts == 0 ||allOrders.length === 0) {
      res.render("salesReport", {
        Mproducts: 0,
        sales: 0,
        orders:0
      });
    }

    res.render("salesReport", {
      Mproducts: SoldProducts,
      sales,
      orders: allOrders,
    });
  } catch (error) {
    next(error);
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

    if (!orders) {
      return 0;
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
        const productCost = productPrice * 0.7;
        const productProfit = (productPrice - productCost) * quantity;
        transformedProductProfits[productId].profit += productProfit;
      }
    }

    const totalStockSoldArray = Object.values(transformedTotalStockSold);
    const productProfitsArray = Object.values(transformedProductProfits);

    const totalSales = Math.floor(
      productProfitsArray.reduce((total, product) => total + product.profit, 0)
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
        $match: {
          "products.OrderStatus": { $ne: "Cancelled" },
        },
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
        $limit: 5, // Limit to the top 5 products
      },
    ];

    const mostSellingProducts = await OrderDB.aggregate(pipeline);
    if (!mostSellingProducts) {
      return 0;
    }

    return mostSellingProducts;
  } catch (error) {
    console.error("Error fetching most selling products:", error);
    return [];
  }
};



// ========== all orders =========
const getorders = async (startDate, endDate) => {
  try {
    // const orders = await OrderDB.find();

    const orders = await OrderDB.find({
      orderDate: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    const productWiseOrdersArray = [];

    for (const order of orders) {
      for (const productInfo of order.products) {
        const productId = productInfo.productId;

        const product = await ProductDB.findById(productId).select(
          "productName  price"
        );
        const userDetails = await User.findById(order.userId).select("email");

        if (product) {
          // Push the order details with product details into the array
          productWiseOrdersArray.push({
            user: userDetails,
            product: product,
            orderDetails: {
              _id: order._id,
              userId: order.userId,
              shippingAddress: order.shippingAddress,
              orderDate: order.orderDate,
              totalAmount: productInfo.quantity * product.price,
              OrderStatus: productInfo.OrderStatus,
              StatusLevel: productInfo.StatusLevel,
              paymentStatus: productInfo.paymentStatus,
              paymentMethod: order.paymentMethod,
              quantity: productInfo.quantity,
              trackId: order.trackId,
            },
          });
        }
      }
    }

    return productWiseOrdersArray;
  } catch (error) {
    console.log(error.message);
  }
};



// ======== portfolio chart data filltering =========
const portfolioFiltering = async (req, res, next) => {
  try {
    let datePriad = req.body.date;

    if (datePriad == "week") {
      let data = await generateWeeklySalesCount();
      res.json({ data });
    } else if (datePriad == "month") {
      let data = await generateMonthlySalesCount();
      data = data.reverse();

      res.json({ data });
    } else if (datePriad == "year") {
      let data = await generateYearlySalesCount();
      res.json({ data });
    }
  } catch (error) {
    next(error);
  }
};



// ======== genarating weekly sales report ========
const generateWeeklySalesCount = async () => {
  try {
    const weeklySalesCounts = [];

    const today = new Date();
    today.setHours(today.getHours() - 5);

    for (let i = 0; i < 7; i++) {
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - i);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1);

      const orders = await OrderDB.find({
        orderDate: {
          $gte: startDate,
          $lt: endDate,
        },
      });

      const salesCount = orders.length;

      weeklySalesCounts.push({
        date: startDate.toISOString().split("T")[0],
        sales: salesCount,
      });
    }

    return weeklySalesCounts;
  } catch (error) {
    console.error("Error generating the weekly sales counts:", error.message);
  }
};



// ========== genarating monthly sales report ==========
const generateMonthlySalesCount = async () => {
  try {
    const monthlySalesCounts = [];

    const today = new Date();
    today.setHours(today.getHours() - 5);

    // Calculate the earliest and latest months
    const latestMonth = new Date(today);
    const earliestMonth = new Date(today);
    earliestMonth.setMonth(earliestMonth.getMonth() - 7); // 7 months ago

    // Create a map to store sales data for each month
    const salesData = new Map();

    // Iterate through the complete date range
    while (earliestMonth <= latestMonth) {
      const monthString = earliestMonth.toLocaleString("default", {
        month: "long",
      });
      salesData.set(monthString, 0);
      earliestMonth.setMonth(earliestMonth.getMonth() + 1);
    }

    // Populate sales data for existing months
    for (let i = 0; i < 7; i++) {
      const startDate = new Date(today);
      startDate.setMonth(today.getMonth() - i);
      startDate.setDate(1);
      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + 1);
      endDate.setDate(endDate.getDate() - 1);

      const orders = await OrderDB.find({
        orderDate: {
          $gte: startDate,
          $lt: endDate,
        },
      });

      const salesCount = orders.length;
      const monthString = startDate.toLocaleString("default", {
        month: "long",
      });

      salesData.set(monthString, salesCount);
    }

    // Convert the map to an array for the final result
    for (const [date, sales] of salesData) {
      monthlySalesCounts.push({ date, sales });
    }

    return monthlySalesCounts;
  } catch (error) {
    console.error("Error generating the monthly sales counts:", error.message);
  }
};



// ========== genarating yearly sales report =========
const generateYearlySalesCount = async () => {
  try {
    const yearlySalesCounts = [];

    const today = new Date();
    today.setHours(today.getHours() - 5);

    for (let i = 0; i < 7; i++) {
      const startDate = new Date(today);
      startDate.setFullYear(today.getFullYear() - i);
      startDate.setMonth(0); // Set the start month to January
      startDate.setDate(1); // Set the start day to the first day of the year
      const endDate = new Date(startDate);
      endDate.setFullYear(startDate.getFullYear() + 1);

      const orders = await OrderDB.find({
        orderDate: {
          $gte: startDate,
          $lt: endDate,
        },
      });

      const salesCount = orders.length;

      yearlySalesCounts.push({
        date: startDate.getFullYear(),
        sales: salesCount,
      });
    }

    return yearlySalesCounts;
  } catch (error) {
    console.error("Error generating the yearly sales counts:", error.message);
  }
};

// // ======== genarating sales excel report ========
// const generateExcelReports = async (req, res) => {
//   try {
//     const { end, start } = req.query;

//     // Create a sales report or fetch it from your data source
//     const sales = await createSalesReport(start, end);

//     // Create a new Excel workbook and worksheet
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet("Sales Report");

//     // Define the columns for the worksheet
//     worksheet.columns = [
//       { header: "Product Name", key: "productName", width: 25 },
//       { header: "Frame Shape", key: "shape", width: 25 },
//       { header: "Price", key: "price", width: 15 },
//       { header: "Profit", key: "profit", width: 15 },
//     ];

//     // Add data to the worksheet
//     sales.productProfits.forEach((product) => {
//       worksheet.addRow({
//         productName: product.name,
//         shape: product.shape, // You should replace this with the actual shape data
//         price: product.price,
//         profit: product.profit,
//       });
//     });

//     // Add the 'Total Sales' value in the footer
//     worksheet.addRow({
//       productName: "Total Sales:",
//       shape: "",
//       price: "",
//       profit: sales.totalSales, // Add the totalSales value here
//     });

//     // Stream the Excel file to the client as a response
//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     );
//     res.setHeader(
//       "Content-Disposition",
//       "attachment; filename=sales_report.xlsx"
//     );

//     workbook.xlsx.write(res).then(() => {
//       res.end();
//     });
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).send("Error generating the Excel report");
//   }
// };

// ======== genarating sales excel report of all orders ========
const generateExcelReportsOfAllOrders = async (req, res, next) => {
  try {
    const { end, start } = req.query;

    // Create a sales report or fetch it from your data source
    const sales = await getorders(start, end);

    // Create a new Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    // Define the columns for the worksheet
    worksheet.columns = [
      { header: "Product Name", key: "productName", width: 25 },
      { header: "Order Id", key: "OrderId", width: 15 },
      { header: "User", key: "User", width: 25 },
      { header: "Order Date", key: "OrderDate", width: 15 },
      { header: "Quantity", key: "Quantity", width: 15 },
      { header: "Price", key: "Price", width: 15 },
      { header: "Pyament Status", key: "PyamentStatus", width: 15 },
      { header: "Order Status", key: "OrderStatus", width: 15 },
    ];

    // Add data to the worksheet
    sales.forEach((orders) => {
      worksheet.addRow({
        productName: orders.product.productName,
        OrderId: orders.orderDetails.trackId,
        User: orders.user.email,
        OrderDate: orders.orderDetails.orderDate
          .toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
          })
          .replace(/\//g, "-"),
        Quantity: orders.orderDetails.quantity,
        Price: orders.orderDetails.totalAmount,
        PyamentStatus: orders.orderDetails.paymentStatus,
        OrderStatus: orders.orderDetails.OrderStatus,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales_report.xlsx"
    );

    workbook.xlsx.write(res).then(() => {
      res.end();
    });
  } catch (error) {
    next(error);
  }
};



// ======== genarating pdf report ========
const generatePDFReportsOfProfit = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const sales = await createSalesReport(start, end);

    // Call the generatePDFReport function to generate the PDF
    await generatePDFReport(sales);

    // Send the generated PDF as a response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales_report.pdf"
    );

    // Send the PDF file
    res.sendFile("sales_report.pdf", { root: "./" }); // Adjust the root directory as needed
  } catch (error) {
    next(error);
  }
};



// ======== pdf creating ===========
const generatePDFReport = async (sales) => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const salesRows = sales.productProfits
      .map(
        (product) => `
      <tr>
        <td>${product.name}</td>
        <td>${product.price}</td>
        <td>${product.profit}</td>
      </tr>`
      )
      .join("");

    const totalSalesRow = `
      <tr>
        <td>Total Sales:</td>
        <td></td>
        <td>${sales.totalSales}</td>
      </tr>`;

    const htmlContent = `
      <style>
        h1 {
          text-align: center;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
      </style>
      <h1>Sales Report</h1>
      <table>
        <tr>
          <th>Product Name</th>
          <th>Price</th>
          <th>Profit</th>
        </tr>
        ${salesRows}
        ${totalSalesRow}
      </table>
    `;

    await page.setContent(htmlContent);
    await page.pdf({
      path: "sales_report.pdf",
      format: "A4",
      printBackground: true,
    });

    await browser.close();
  } catch (error) {
    console.error(error.message);
  }
};




module.exports = {
  salesReportPageLoad,
  portfolioFiltering,
  generatePDFReportsOfProfit,
  generateExcelReportsOfAllOrders,
};
