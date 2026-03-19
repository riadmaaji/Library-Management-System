import api from '../axios';

export async function getBorrows(params) {
  const response = await api.get('/borrows', { params });
  return response.data;
}

export async function borrowBook(data) {
  const response = await api.post('/borrows', data);
  return response.data;
}

export async function returnBook(id) {
  const response = await api.post(`/borrows/${id}/return`);
  return response.data;
}
