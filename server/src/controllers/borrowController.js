const borrowService = require('../services/borrowService');

function listBorrows(req, res, next) {
  try {
    const borrows = borrowService.listBorrows(req.query);
    res.json({
      success: true,
      data: borrows,
    });
  } catch (error) {
    next(error);
  }
}

function borrowBook(req, res, next) {
  try {
    const borrow = borrowService.borrowBook(req.body);
    res.status(201).json({
      success: true,
      data: borrow,
    });
  } catch (error) {
    next(error);
  }
}

function returnBook(req, res, next) {
  try {
    const borrow = borrowService.returnBook(req.params.id);
    res.json({
      success: true,
      data: borrow,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listBorrows,
  borrowBook,
  returnBook,
};
