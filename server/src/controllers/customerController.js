const customerService = require('../services/customerService');

function listCustomers(req, res, next) {
  try {
    const customers = customerService.listCustomers();
    res.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
}

function createCustomer(req, res, next) {
  try {
    const customer = customerService.createCustomer(req.body);
    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
}

function updateCustomer(req, res, next) {
  try {
    const customer = customerService.updateCustomer(req.params.id, req.body);
    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCustomers,
  createCustomer,
  updateCustomer,
};
