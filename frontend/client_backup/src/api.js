import axios from 'axios';

// Use environment variable for backend base URL
const API = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`
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
