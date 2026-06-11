import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({ baseURL: BASE });

// Products
export const getProducts    = () => api.get("/products/").then(r => r.data);
export const getProduct     = (id) => api.get(`/products/${id}`).then(r => r.data);
export const createProduct  = (data) => api.post("/products/", data).then(r => r.data);
export const updateProduct  = (id, data) => api.put(`/products/${id}`, data).then(r => r.data);
export const deleteProduct  = (id) => api.delete(`/products/${id}`);

// Customers
export const getCustomers   = () => api.get("/customers/").then(r => r.data);
export const getCustomer    = (id) => api.get(`/customers/${id}`).then(r => r.data);
export const createCustomer = (data) => api.post("/customers/", data).then(r => r.data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data).then(r => r.data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);

// Orders
export const getOrders       = () => api.get("/orders/").then(r => r.data);
export const getOrder        = (id) => api.get(`/orders/${id}`).then(r => r.data);
export const createOrder     = (data) => api.post("/orders/", data).then(r => r.data);
export const updateOrderStatus = (id, status) => api.put(`/orders/${id}/status`, { status }).then(r => r.data);
export const deleteOrder     = (id) => api.delete(`/orders/${id}`);

// Dashboard
export const getDashboardStats = () => api.get("/dashboard/stats").then(r => r.data);
