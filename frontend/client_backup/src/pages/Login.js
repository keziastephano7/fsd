import React, { useState } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

export default function Login({ onAuth }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const nav = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    try {
      const res = await API.post('/auth/login', form);
      onAuth(res.data.user, res.data.token);
      nav('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const map = {};
        data.errors.forEach(x => {
          map[x.param] = x.msg;
        });
        setFieldErrors(map);
      } else {
        setError(data?.message || 'Login failed');
      }
    }
  };

  return (
    <div className="card">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} type="email" required />
        {fieldErrors.email && <div className="error">{fieldErrors.email}</div>}
        <input name="password" placeholder="Password" value={form.password} onChange={handleChange} type="password" required />
        {fieldErrors.password && <div className="error">{fieldErrors.password}</div>}
        <button type="submit">Login</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
