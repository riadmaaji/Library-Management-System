import api from '../axios';

export async function getCustomers() {
  const response = await api.get('/customers');
  return response.data;
}

export async function createCustomer(data) {
  const response = await api.post('/customers', data);
  return response.data;
}

export async function updateCustomer(id, data) {
  const response = await api.put(`/customers/${id}`, data);
  return response.data;
}
