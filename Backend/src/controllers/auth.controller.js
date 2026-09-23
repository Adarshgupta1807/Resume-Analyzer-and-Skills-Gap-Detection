const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const tokenBlacklistModel=require("../models/blacklist.model")

/**
 * @name registerUser
 * @description Register a new user     
 * @access Public
 * 
 */
async function registerUser(req, res) {
    const { username, email, password } = req.body;
    if(!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    const isUserExists = await userModel.findOne({
        $or: [{ username }, { email }]
    });
    if(isUserExists) {
        return res.status(400).json({ message: "Username or email already exists" });
    }
    const hash= await bcrypt.hash(password, 10);
    const User = new userModel({
        username,
        email,
        password: hash
    });

    

    const token = jwt.sign(
        { id: User._id }, 
        process.env.JWT_SECRET, 
        { expiresIn: "1d" }
    );

    res.cookie("token", token)

    res.status(201).json({ 
        message: "User registered successfully",
        user: {
            id: User._id,
            username: User.username,
            email: User.email
        }
    });

}

/**
 * @name loginUser
 * @description Login a user expects email and password in the request body   
 * @access Public
 */

async function loginUser(req, res) {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if(!user) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(!isPasswordValid) {
        return res.status(400).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    res.cookie("token", token);

    res.status(200).json({
        message: "User logged in successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
        }
    });
}

/**
 * @name logoutUser
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */
async function logoutUser(req, res) {
    const token = req.cookies.token

    if (token) {
        await tokenBlacklistModel.create({ token })
    }

    res.clearCookie("token")

    res.status(200).json({
        message: "User logged out successfully"
    })
}

/**
 * @name getMe
 * @description get the current logged in user details.
 * @access private
 */
async function getMe(req, res) {

    const user = await userModel.findById(req.user.id)



    res.status(200).json({
        message: "User details fetched successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })

}

module.exports = {registerUser, loginUser, logoutUser, getMe};