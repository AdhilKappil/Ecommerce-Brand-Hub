
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../public/adminAssets/images/products'));
  },
  filename: function(req, file, cb) {
    const name = Date.now() + '-' + file.originalname;
    cb(null, name);
  }
});

const uploadMiddleware = multer({ storage: storage });

module.exports = {
  upload: uploadMiddleware
};