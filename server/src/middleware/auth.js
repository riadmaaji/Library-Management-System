const db = require('../storage/LocalStorageDB');
const { COLLECTIONS } = require('../config/constants');
const { verifyToken } = require('../utils/token');
const { UnauthorizedError, ForbiddenError } = require('../utils/AppError');

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError();
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      throw new UnauthorizedError();
    }

    const decodedToken = verifyToken(token);
    const user = db.getById(COLLECTIONS.USERS, decodedToken.id);

    if (!user) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    req.user = sanitizeUser(user);
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }

    return next(new UnauthorizedError('Invalid or expired token'));
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      if (!roles.includes(req.user.role)) {
        throw new ForbiddenError();
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  authenticate,
  authorize,
};
