const jwt = require('jsonwebtoken');

// This is the "gatekeeper" function that protects your API routes.
function authenticateToken(req, res, next) {
  // 1. Look for the standard 'Authorization' header.
  const authHeader = req.headers['authorization'];
  
  // 2. The header format is "Bearer YOUR_TOKEN_HERE". This line extracts just the token part.
  const token = authHeader && authHeader.split(' ')[1];

  // 3. If there is no token, block the request. This is what's currently happening.
  if (token == null) {
    return res.status(401).json({ message: "Unauthorized: No token provided!" });
  }

  // 4. Verify the token using the secret key from your .env file.
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      // If the token is expired or invalid, block the request.
      return res.status(403).json({ message: "Forbidden: Token is not valid" });
    }

    // 5. If the token is valid, attach the user's information to the request
    //    and allow it to proceed to the controller (e.g., cars.create).
    req.user = user;
    next();
  });
}

module.exports = {
  authenticateToken
};

