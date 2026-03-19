const userService = require('../services/userService');

function listUsers(req, res, next) {
  try {
    const users = userService.listUsers();
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const user = await userService.createUser(req.body);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

function deleteUser(req, res, next) {
  try {
    const result = userService.deleteUser(req.params.id, req.user.id);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
};
