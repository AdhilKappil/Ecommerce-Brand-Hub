
const isLogin = async (req, res, next) => {
    try {
        if (req.session.admin_id) {
            return next(); // Proceed to the next middleware or route
        } else {
            res.redirect('/admin');
        }
    } catch (error) {
        console.log(error.message);
        res.redirect('/admin'); // Handle errors by redirecting
    }
}

const isLogout = async (req, res, next) => {
    try {
        if (req.session.admin_id) {
            res.redirect('/admin/dashboard');
        } else {
            return next(); // Proceed to the next middleware or route
        }
    } catch (error) {
        console.log(error.message);
        res.redirect('/admin/dashboard'); // Handle errors by redirecting
    }
}


module.exports ={
    isLogin,
    isLogout
}