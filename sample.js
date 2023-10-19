const category = require("./models/category");

try {
    const perPage = 12; // Number of products per page
    let page = parseInt(req.query.page) || 1; // Get the page from the request query and parse it as an integer
    const categoryDetails = await Category.find({});
    const totalProducts = await Product.countDocuments({ is_active: true });
    const totalPages = Math.ceil(totalProducts / perPage);

    // Ensure that the page is within valid bounds
    if (page < 1) {
      page = 1;
    } else if (page > totalPages) {
      page = totalPages;
    }

    const products = await Product
      .find({})
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.render('shop', {
      catData: categoryDetails,
      product: products,
      currentPage: page,
      pages: totalPages,
    });
  } catch (error) {
    console.log(error);
  }