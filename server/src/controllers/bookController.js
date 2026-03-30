const bookService = require('../services/bookService');

function listBooks(req, res, next) {
  try {
    const books = bookService.listBooks(req.query);
    res.json({
      success: true,
      data: books,
    });
  } catch (error) {
    next(error);
  }
}

function createBook(req, res, next) {
  try {
    const book = bookService.createBook(req.body);
    res.status(201).json({
      success: true,
      data: book,
    });
  } catch (error) {
    next(error);
  }
}

function updateBook(req, res, next) {
  try {
    const book = bookService.updateBook(req.params.id, req.body);
    res.json({
      success: true,
      data: book,
    });
  } catch (error) {
    next(error);
  }
}

function deleteBook(req, res, next) {
  try {
    const result = bookService.deleteBook(req.params.id);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listBooks,
  createBook,
  updateBook,
  deleteBook,
};
