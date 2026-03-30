const authService = require('../services/authService');

async function loginHandler(req, res, next) {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.login(email, password);

    res.json({
      success: true,
      data: {
        token,
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}

function getMeHandler(req, res, next) {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  loginHandler,
  getMeHandler,
};
