require('dotenv').config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Check your server/.env file.');
}

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  DEFAULT_BORROW_DAYS: parseInt(process.env.DEFAULT_BORROW_DAYS, 10) || 14,
  PENALTY_PER_DAY: parseFloat(process.env.PENALTY_PER_DAY) || 2,
};
