import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {

      if (typeof window !== 'undefined') {
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);


export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  
  register: (email: string, password: string, role?: string) =>
    apiClient.post('/auth/register', { email, password, role }),
  
  getProfile: (token?: string) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return apiClient.get('/auth/profile', { headers });
  },
  
  refreshToken: () =>
    apiClient.post('/auth/refresh'),
};


export const sweetsApi = {
  getAll: () =>
    apiClient.get('/sweets'),
  
  getById: (id: number) =>
    apiClient.get(`/sweets/${id}`),
  
  search: (params: {
    name?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  }) =>
    apiClient.get('/sweets/search', { params }),
  
  getCategories: () =>
    apiClient.get('/sweets/categories'),
  
  create: (sweetData: {
    name: string;
    category: string;
    price: number;
    quantity: number;
    description?: string;
    image_url?: string;
  }) =>
    apiClient.post('/sweets', sweetData),
  
  update: (id: number, sweetData: Partial<{
    name: string;
    category: string;
    price: number;
    quantity: number;
    description: string;
    image_url: string;
  }>) =>
    apiClient.put(`/sweets/${id}`, sweetData),
  
  delete: (id: number) =>
    apiClient.delete(`/sweets/${id}`),
  
  purchase: (id: number, quantity: number) =>
    apiClient.post(`/sweets/${id}/purchase`, { quantity }),
  
  restock: (id: number, quantity: number) =>
    apiClient.post(`/sweets/${id}/restock`, { quantity }),
};


export const inventoryApi = {
  getPurchaseHistory: () =>
    apiClient.get('/inventory/purchases'),
  
  getInventoryLogs: (sweetId?: number) =>
    sweetId 
      ? apiClient.get(`/inventory/logs/${sweetId}`)
      : apiClient.get('/inventory/logs'),
  
  getStats: () =>
    apiClient.get('/inventory/stats'),
};


export const fetchSweets = () => sweetsApi.getAll();
export const purchaseSweet = (id: number, quantity: number) => sweetsApi.purchase(id, quantity);
export const fetchSweetById = (id: number) => sweetsApi.getById(id);
export const searchSweets = (params: any) => sweetsApi.search(params);
export const createSweet = (sweetData: any) => sweetsApi.create(sweetData);
export const updateSweet = (id: number, sweetData: any) => sweetsApi.update(id, sweetData);
export const deleteSweet = (id: number) => sweetsApi.delete(id);
export const restockSweet = (id: number, quantity: number) => sweetsApi.restock(id, quantity);

export default apiClient;
