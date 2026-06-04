import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3333", // backend Adonis
  withCredentials: true, // penting kalau pakai cookie
});

// attach token kalau ada
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
