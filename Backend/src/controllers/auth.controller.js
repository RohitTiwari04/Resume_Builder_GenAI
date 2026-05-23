const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const tokenBlacklistModel = require('../models/blacklist.model');

// Ephemeral memory cache for registration OTP verification
const otpCache = new Map();

// Cross-site cookie configurations for production compatibility
const isProduction = process.env.NODE_ENV === "production";
const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000 // 1 day
};

/**
    * @name registerUserController
    *  @description register a new user , except user
    * @access public
 */
async function registerUserController(req, res) {
    try {
        const { username, email, password, otp } = req.body

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Please provide username, email and password"
            })
        }

        const isUserAlreadyExists = await userModel.findOne({
            $or: [ { username }, { email } ]
        })

        if (isUserAlreadyExists) {
            return res.status(400).json({
                message: "Account already exists with this email address or username"
            })
        }

        // Intercept registrations from Gmail accounts for OTP verification
        const isGmail = email.toLowerCase().endsWith("@gmail.com");
        if (isGmail) {
            if (!otp) {
                // Generate a secure random 6-digit numeric OTP
                const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
                
                // Store in memory cache with 5-minute expiry (300,000 ms)
                otpCache.set(email.toLowerCase(), {
                    otp: generatedOtp,
                    expiresAt: Date.now() + 5 * 60 * 1000
                });

                // Display a clear neon-styled terminal log for ease of developer copy-paste
                console.log("\n==============================================");
                console.log("⚡ [GMAIL OTP SERVICE] Verification Code Staged");
                console.log(`📧 Candidate Email: \x1b[36m${email}\x1b[0m`);
                console.log(`🔑 Generated OTP:   \x1b[32;1m${generatedOtp}\x1b[0m`);
                console.log("==============================================\n");

                return res.status(200).json({
                    requiresOtp: true,
                    devOtp: generatedOtp, // Developer HUD bubble helper
                    message: "A verification code has been staged for your Gmail account."
                });
            } else {
                // Verify the submitted OTP against the cache
                const cachedRecord = otpCache.get(email.toLowerCase());
                if (!cachedRecord) {
                    return res.status(400).json({
                        message: "No OTP request found for this email. Please request a new code."
                    });
                }

                if (Date.now() > cachedRecord.expiresAt) {
                    otpCache.delete(email.toLowerCase());
                    return res.status(400).json({
                        message: "Verification code has expired. Please request a new OTP."
                    });
                }

                if (cachedRecord.otp !== otp.trim()) {
                    return res.status(400).json({
                        message: "Invalid verification code. Please double-check your code."
                    });
                }

                // Clean the cache record upon successful validation
                otpCache.delete(email.toLowerCase());
            }
        }

        const hash = await bcrypt.hash(password, 10)

        const user = await userModel.create({
            username,
            email,
            password: hash
        })

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )

        res.cookie("token", token, cookieOptions)

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (error) {
        if (error.name === "ValidationError") {
            const firstErrorKey = Object.keys(error.errors)[0];
            return res.status(400).json({
                message: error.errors[firstErrorKey].message
            });
        }
        return res.status(500).json({
            message: "Something went wrong during registration. Please check your inputs."
        });
    }
}

/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */
async function loginUserController(req, res) {

    const { email, password } = req.body

    const user = await userModel.findOne({ email })

    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    res.cookie("token", token, cookieOptions)
    res.status(200).json({
        message: "User loggedIn successfully.",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}

/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */
async function logoutUserController(req, res) {
    const token = req.cookies.token

    if (token) {
        await tokenBlacklistModel.create({ token })
    }

    res.clearCookie("token", cookieOptions)

    res.status(200).json({
        message: "User logged out successfully"
    })
}

/**
 * @name getMeController
 * @description get the current logged in user details.
 * @access private
 */
async function getMeController(req, res) {

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



module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}