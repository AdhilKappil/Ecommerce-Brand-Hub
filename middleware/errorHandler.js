
const errorHandler = (err, req, res, next) => {
    console.log("err:", err.name);

    if (err.name === 'CastError' || err.name === 'MulterError') {
        console.log(err);
        // Handle CastError and MulterError specifically
        res.status(404).render('404-error');
    } else {
        // For other errors, log and render a generic 500 error
        console.log(err);
        res.status(500).render('500-error');
    }
};

module.exports = errorHandler;  