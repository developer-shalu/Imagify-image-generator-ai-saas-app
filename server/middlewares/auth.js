import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {   
  // Support both custom 'token' header and standard 'Authorization: Bearer <token>'
  let token = req.headers.token;
  const authHeader = req.headers.authorization || "";
  if (!token && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not Authorized. Login Again" });
  }
  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
  
    if (tokenDecode.id) {
      // attach the userId to req instead of body so it works for GET as well
      req.userId = tokenDecode.id;
      return next();
    } else {
      return res.status(401).json({ success: false, message: "Not Authorized. Login Again" });
    }
  } catch (error) {
    console.log(error);
    return res.status(401).json({ success: false, message: error.message });
  }

};

export default userAuth;