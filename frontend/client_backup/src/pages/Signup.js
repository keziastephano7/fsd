import React, { useState } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

export default function Signup({ onAuth }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const nav = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    try {
      const res = await API.post('/auth/register', form);
      onAuth(res.data.user, res.data.token);
      nav('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        // map array to object { field: message }
        const map = {};
        data.errors.forEach(x => {
          map[x.param] = x.msg;
        });
        setFieldErrors(map);
      } else {
        setError(data?.message || 'Signup failed');
      }
    }
  };

  return (
    <div className="card">
      <h2>Signup</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        {fieldErrors.name && <div className="error">{fieldErrors.name}</div>}
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} type="email" required />
        {fieldErrors.email && <div className="error">{fieldErrors.email}</div>}
        <input name="password" placeholder="Password" value={form.password} onChange={handleChange} type="password" required />
        {fieldErrors.password && <div className="error">{fieldErrors.password}</div>}
        <button type="submit">Signup</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
