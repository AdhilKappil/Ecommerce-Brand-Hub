
const isLogin = async (req, res, next) => {
    try {
        if (req.session.user_id) {
             next(); // Proceed to the next middleware or route
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.log(error.message);
        res.redirect('/login'); // Handle errors by redirecting
    }
}

const isLogout = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            res.redirect('/');
        } else {
             next(); // Proceed to the next middleware or route
        }
    } catch (error) {
        console.log(error.message);
        res.redirect('/'); // Handle errors by redirecting
    }
}


module.exports ={
    isLogin,
    isLogout
}