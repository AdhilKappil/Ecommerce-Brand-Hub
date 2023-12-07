const Banner = require("../models/banner");



// ======= loading add banner =======
const loadAddBanner = async (req, res, next) => {
  try {
    res.render("addBanner");
  } catch (error) {
    next(error);
  }
};



// ========== adding banner ==========
const insertBanner = async (req, res, next) => {
  try {
    const image = req.file.filename;
    const title = req.body.title;
    const description = req.body.description;
    const position = req.body.position;
    let banner = new Banner({
      title: title,
      description: description,
      position: position,
      image: image,
      status: true,
    });

    let result = await banner.save();
    res.redirect("/admin/banner");
  } catch (error) {
    next(error);
  }
};



// ========= rendering the banner page =========
const loadBanner = async (req, res, next) => {
  try {
    const banner = await Banner.find();

    res.render("banner", { banner: banner });
  } catch (error) {
    next(error);
  }
};



// ========= block or unblock banner =========
const blockBanner = async (req, res, next) => {
  try {
    const id = req.query.id;

    const banner = await Banner.findOne({ _id: id });
    if (banner.status == true) {
      await Banner.updateOne({ _id: id }, { $set: { status: false } });
    } else {
      await Banner.updateOne({ _id: id }, { $set: { status: true } });
    }
    if (banner) {
      res.redirect("/admin/banner");
    } else {
      console.console.log("not get");
    }
  } catch (error) {
    next(error);
  }
};



// ========= edit banner ========
const editBanner = async (req, res, next) => {
  try {
    const bannerId = req.query.id;
    const banner = await Banner.findOne({ _id: bannerId });
    res.render("editBanner", { banner: banner });
  } catch (error) {
    next(error);
  }
};



// =========== updating banner =========
const updateBanner = async (req, res, next) => {
  try {
    const updateFields = {
      title: req.body.title,
      description: req.body.description,
      position: req.body.position,
    };

    if (req.file && req.file.filename) {
     // If a new image is uploaded, update the image field
      updateFields.image = req.file.filename;
    }

    const updated = await Banner.updateOne(
      { _id: req.query.id },
      { $set: updateFields }
    );

    if (updated) {
      res.redirect("/admin/banner");
    } else {
      console.log("Not updated");
    }
  } catch (error) {
    next(error);
  }
};




module.exports = {
  loadAddBanner,
  insertBanner,
  loadBanner,
  blockBanner,
  editBanner,
  updateBanner,
};
