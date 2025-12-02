const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = db.User;
const generateTokens = (user) => {
    const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "your-jwt-secret-key", {
        expiresIn: '15m', // Access token expires in 15 minutes
    });
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET || "your-jwt-refresh-secret-key", {
        expiresIn: '7d', // Refresh token expires in 7 days
    });
    return { accessToken, refreshToken };
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 🔍 Find user by username
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    // 🚨 Prevent login if user is deactivated
    if (user.is_active === false) {
      return res.status(403).send({
        accessToken: null,
        message: "Your account has been deactivated. Please contact support."
      });
    }

    // 🔒 Validate password
    const passwordIsValid = bcrypt.compareSync(password, user.password);

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid password!"
      });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    user.refresh_token = refreshToken;
    await user.save();
    
    // ===> UPDATED COOKIE SETTINGS <===
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        // 'None' allows the cookie to be sent in cross-site requests (frontend -> backend)
        sameSite: 'None', 
        // 'Secure' is REQUIRED when sameSite is 'None'. It means HTTPS only.
        secure: true, 
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // ✅ Send response
    res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      is_superuser: user.is_superuser,
      is_staff: user.is_staff,
      is_active: user.is_active,
      accessToken: accessToken,
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send({ message: "Internal server error." });
  }
};

exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        return res.status(401).send({ message: "Access Denied. No refresh token provided." });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "your-jwt-refresh-secret-key");
        const user = await User.findOne({ where: { id: decoded.id } });

        if (!user) {
            return res.status(403).send({ message: "User not found." });
        }

        if (!user.is_active) {
            return res.status(403).send({ message: "Account is deactivated." });
        }

        if (user.refresh_token !== refreshToken) {
            // This could be a sign of a stolen token, so we invalidate it
            user.refresh_token = null;
            await user.save();
            return res.status(403).send({ message: "Invalid refresh token. Please log in again." });
        }

        // Generate new tokens (rotating refresh token for better security)
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user);
        
        // Update the refresh token in database
        user.refresh_token = newRefreshToken;
        await user.save();
        
        // Set new refresh token cookie
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            sameSite: 'None',
            secure: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        res.status(200).send({
            accessToken: newAccessToken
        });

    } catch (error) {
        console.error("Refresh token error:", error);
        return res.status(403).send({ message: "Invalid or expired refresh token." });
    }
};

exports.logout = async (req, res) => {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "your-jwt-refresh-secret-key");
            const user = await User.findOne({ where: { id: decoded.id } });
            if (user) {
                user.refresh_token = null;
                await user.save();
            }
        } catch (err) {
            // Ignore errors if token is invalid, just clear the cookie
            console.error("Logout token verification error:", err);
        }
    }

    res.clearCookie('refreshToken');
    res.status(200).send({ message: "Logged out successfully." });
};