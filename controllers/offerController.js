const mongoose = require("mongoose");
const Offer = require("../models/offer");
const Category = require("../models/category");
const productDb = require("../models/product");



// ======= loading the add product page =========
const loadAddOffer = async (req, res, next) => {
  try {
    res.render("addOffer");
  } catch (error) {
    next(error);
  }
};



// ========== adding new offers =========
const addOffer = async (req, res, next) => {
  try {
    const { startingDate, expiryDate, percentage } = req.body;
    const name = req.body.name;
    const offerExist = await Offer.findOne({ name: name });
    if (offerExist) {
      res.render("addOffer", { message: "Offer already existing" });
    } else {
      const offer = new Offer({
        name: name,
        startingDate: startingDate,
        expiryDate: expiryDate,
        discount: percentage,
      });
      await offer.save();
      res.redirect("/admin/offer");
    }
  } catch (error) {
    next(error);
  }
};



// ======= rendering the home page =======
const loadOffers = async (req, res, next) => {
  try {
    const offers = await Offer.find();
    res.render("offer", {
      offers: offers,
      now: new Date(),
    });
  } catch (error) {
    next(error);
  }
};



// ======== rendering edit offer =========
const loadEditOffer = async (req, res, next) => {
  try {
    const id = req.params.id;
    const offer = await Offer.findOne({ _id: id });
    res.render("editOffer", {
      offer: offer,
    });
  } catch (error) {
    next(error);
  }
};



// ======== updating edited data =======
const editOffer = async (req, res, next) => {
  try {
    const { id, name, startingDate, expiryDate, percentage } = req.body;
    await Offer.updateOne(
      { _id: id },
      {
        $set: {
          name: name,
          startingDate: startingDate,
          expiryDate: expiryDate,
          discount: percentage,
        },
      }
    );
    res.redirect("/admin/offer");
  } catch (error) {
    next(error);
  }
};



// ========= offer calceling ==========
const cancelOffer = async (req, res, next) => {
  try {
    const { offerId } = req.body;
    await Offer.updateOne(
      { _id: offerId },
      {
        $set: {
          status: false,
        },
      }
    );
    res.json({ cancelled: true });
  } catch (error) {
    res.json({ cancelled: false, message: "Cant cancel some errors" });
    next(error);
  }
};



// =========== applying catogory offer ========
const applyCategoryOffer = async (req, res, next) => {
  try {
    const { offerId, categoryId } = req.body;

    const categoryOffer = await Offer.findOne({ _id: offerId });

    if (!categoryOffer) {
      return res.json({ success: false, message: "Category Offer not found" });
    }

    await Category.updateOne({ _id: categoryId }, { $set: { offer: offerId } });

    const productsInCategory = await productDb.find({ category: categoryId });

    for (const product of productsInCategory) {
      const productOffer = product.offer
        ? await Offer.findOne({ _id: product.offer })
        : null;

      // Check if the product has no offer or the category offer has a greater discount
      if (
        !product.offer ||
        (productOffer && productOffer.discount < categoryOffer.discount)
      ) {
        const originalPrice = parseFloat(product.price);
        // Assuming originalPrice and categoryOffer.discount are integers
        const discountedPrice = Math.floor(
          originalPrice - (originalPrice * categoryOffer.discount) / 100
        );

        // Update the product with the category offer details
        await productDb.updateOne(
          { _id: product._id },
          {
            $set: {
              offer: offerId,
              discountedPrice: discountedPrice,
            },
          }
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};



// ======= removing offer from catogory ==========
const removeCategoryOffer = async (req, res, next) => {
  try {
    const { categoryId } = req.body;

    const category = await Category.findById(categoryId).populate("offer");

    if (!category) {
      return res.json({ success: false, message: "Category not found" });
    }

    await Category.updateOne({ _id: categoryId }, { $unset: { offer: "" } });

    const productsInCategory = await productDb.find({ category: categoryId });

    for (const product of productsInCategory) {
      if (product.offer) {
        const productOffer = await Offer.findById(product.offer);

        // Check if the product has a greater discount than the category's offer
        if (productOffer && productOffer.discount > category.offer.discount) {
          continue; // Skip this product, as it has a greater discount
        }
      }

      // Remove the offer and reset discounted prices for the product
      await productDb.updateOne(
        { _id: product._id },
        {
          $unset: {
            offer: "",
            discountedPrice: "",
          },
        }
      );
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};



// ========== applying offer to the product ======
const applyProductOffer = async (req, res, next) => {
  try {
    const productId = req.body.productId;
    const offerId = req.body.offerId;

    const offer = await Offer.findOne({ _id: offerId });

    if (!offer) {
      return res.json({ success: false, message: "Offer not found" });
    }

    const product = await productDb
      .findOne({ _id: productId })
      .populate("category");

    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    // Get the category discount, if available
    const categoryDiscount =
      product.category && product.category.offer
        ? await Offer.findOne({ _id: product.category.offer })
        : 0;

    // Calculate real price and discounted price for the product
    const discountPercentage = offer.discount;
    const originalPrice = parseFloat(product.price);
    // Assuming originalPrice and discountPercentage are integers
    const discountedPrice = Math.floor(
      originalPrice - (originalPrice * discountPercentage) / 100
    );

    // Check if category offer is available and its discount is greater than product offer
    if (categoryDiscount && categoryDiscount.discount > discountPercentage) {
      // You can handle this case as needed, e.g., not applying the product offer
      return res.json({
        success: false,
        message: "Category offer has greater discount",
      });
    }

    // Update product with offer details
    await productDb.updateOne(
      { _id: productId },
      {
        $set: {
          offer: offerId,
          discountedPrice: discountedPrice,
        },
      }
    );

    const updatedProduct = await productDb
      .findOne({ _id: productId })
      .populate("offer");
    res.json({ success: true, data: updatedProduct });
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};



// ========= removing product offer =======
const removeProductOffer = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const remove = await productDb.updateOne(
      { _id: productId },
      {
        $unset: {
          offer: "",
          discountedPrice: "",
        },
      }
    );

    res.json({ success: true, data: remove });
  } catch (error) {
    next(error);
  }
};




module.exports = {
  loadAddOffer,
  addOffer,
  loadOffers,
  loadEditOffer,
  editOffer,
  cancelOffer,
  applyCategoryOffer,
  removeCategoryOffer,
  applyProductOffer,
  removeProductOffer,
};
