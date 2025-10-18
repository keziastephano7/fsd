import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api' // backend base
});

// helper to set auth token
export function setAuthToken(token) {
  if (token) {
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete API.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
}

// if token exists on load, set header
const token = localStorage.getItem('token');
if (token) setAuthToken(token);

export default API;
