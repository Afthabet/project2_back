// controllers/auth.controller.js
const db = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt"); // npm install bcrypt
const crypto = require("crypto");
const util = require("util");

const pbkdf2Async = util.promisify(crypto.pbkdf2);

const User = db.User;
const RefreshToken = db.RefreshToken; // <-- Make sure you create this model

// --- Helper Functions ---
function generateAccessToken(user) {
  const payload = { id: user.id, name: user.username, is_superuser: user.is_superuser };
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
}

async function saveRefreshToken(userId, token) {
  try {
    await RefreshToken.create({ token, userId });
  } catch (err) {
    console.error("[AUTH] Failed to save refresh token:", err);
  }
}

async function removeRefreshToken(token) {
  try {
    await RefreshToken.destroy({ where: { token } });
  } catch (err) {
    console.error("[AUTH] Failed to remove refresh token:", err);
  }
}

// --- Controllers ---
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`[AUTH] Login attempt for username: ${username}`);

    const user = await User.findOne({ where: { username } });
    if (!user) {
      console.warn(`[AUTH] No user found for username: ${username}`);
      return res.status(404).send({ message: "User not found." });
    }

    if (!user.is_active) {
      console.warn(`[AUTH] User is inactive: ${username}`);
      return res.status(403).send({ message: "Your account has been deactivated." });
    }

    const storedPassword = user.password;
    let passwordIsValid = false;

    if (storedPassword.startsWith("pbkdf2_sha256$")) {
      // Handle Django-style password hash
      const parts = storedPassword.split("$");
      if (parts.length === 4) {
        const [algorithm, iterations, salt, storedHash] = parts;
        if (algorithm === "pbkdf2_sha256") {
          const derivedKey = await pbkdf2Async(
            password,
            salt,
            parseInt(iterations, 10),
            32,
            "sha256"
          );
          passwordIsValid = derivedKey.toString("base64") === storedHash;
        } else {
          console.error(`[AUTH] Unsupported password algorithm: ${algorithm}`);
        }
      } else {
        console.error("[AUTH] Invalid pbkdf2 hash format in DB for user:", username);
      }
    } else {
      // Fallback: bcrypt (Node-native users)
      try {
        passwordIsValid = await bcrypt.compare(password, storedPassword);
      } catch (err) {
        console.error("[AUTH] bcrypt compare failed:", err);
      }
    }

    if (!passwordIsValid) {
      console.warn(`[AUTH] Invalid password for user: ${username}`);
      return res.status(401).send({ message: "Invalid password!" });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET);

    await saveRefreshToken(user.id, refreshToken);

    console.log(`[AUTH] Login successful for user: ${username}`);
    res.status(200).send({
      id: user.id,
      username: user.username,
      is_superuser: user.is_superuser,
      accessToken,
      refreshToken,
    });

  } catch (error) {
    console.error("[AUTH] Login process failed:", error);
    res.status(500).send({ message: "Unexpected internal server error: " + error.message });
  }
};

exports.refreshToken = async (req, res) => {
  const { token: requestToken } = req.body;
  if (!requestToken) {
    return res.status(401).json({ message: "Refresh Token is required!" });
  }

  try {
    const storedToken = await RefreshToken.findOne({ where: { token: requestToken } });
    if (!storedToken) {
      console.warn("[AUTH] Refresh token not found or revoked.");
      return res.status(403).json({ message: "Refresh token is not valid or has been revoked." });
    }

    jwt.verify(requestToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        console.warn("[AUTH] Invalid refresh token:", err.message);
        return res.status(403).json({ message: "Invalid Refresh Token" });
      }

      try {
        const user = await User.findByPk(decoded.id);
        if (!user || !user.is_active) {
          console.warn("[AUTH] User for refresh token no longer exists or inactive.");
          return res.status(404).send({ message: "User associated with this token no longer exists or is inactive." });
        }

        const newAccessToken = generateAccessToken(user);
        console.log(`[AUTH] Issued new access token for user: ${user.username}`);
        return res.status(200).json({ accessToken: newAccessToken });

      } catch (error) {
        console.error("[AUTH] Error refreshing token:", error);
        return res.status(500).send({ message: "Error refreshing token: " + error.message });
      }
    });

  } catch (error) {
    console.error("[AUTH] refreshToken controller error:", error);
    res.status(500).send({ message: "Unexpected error verifying refresh token: " + error.message });
  }
};

exports.logout = async (req, res) => {
  const { token } = req.body;
  await removeRefreshToken(token);
  console.log("[AUTH] Logout successful.");
  res.status(200).send({ message: "Logged out successfully!" });
};
