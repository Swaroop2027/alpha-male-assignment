import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ApiError } from "../utils/apiResponse.js";

// Verify JWT Token & Attach Authenticated User to req.user
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.query && req.query.token) {
    // Support token in query string for direct browser PDF/media downloads
    token = req.query.token;
  }

  if (!token) {
    return next(
      new ApiError("Not authorized to access this route. Token missing.", 401),
    );
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "alpha_male_super_secret_jwt_key_2026",
    );
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return next(new ApiError("User account not found or deactivated.", 401));
    }

    req.user = user;
    next();
  } catch {
    return next(
      new ApiError("Not authorized to access this route. Invalid token.", 401),
    );
  }
};

// Backend Role-Based Access Control (RBAC) Enforcement
// Allowed Roles: 'Admin', 'Operations', 'Sales/Support', 'Customer'
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError("Authentication required.", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          `Forbidden: Role '${req.user.role}' is not authorized to access this endpoint.`,
          403,
        ),
      );
    }
    next();
  };
};
