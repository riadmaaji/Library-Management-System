import api from '../axios';

export async function getBooks(params) {
  const response = await api.get('/books', { params });
  return response.data;
}

export async function createBook(data) {
  const response = await api.post('/books', data);
  return response.data;
}

export async function updateBook(id, data) {
  const response = await api.put(`/books/${id}`, data);
  return response.data;
}

export async function deleteBook(id) {
  const response = await api.delete(`/books/${id}`);
  return response.data;
}
