import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const { register, login, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', email: '', password: '', password2: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (user) { navigate('/', { replace: true }); return null; }

  const handleChange = e =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await register(form);
      await login(form.username, form.password);
      navigate('/');
    } catch (err) {
      const data = err.response?.data || {};
      if (typeof data === 'object') {
        setErrors(data);
      } else {
        setErrors({ non_field_errors: ['Registration failed. Please try again.'] });
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (key) =>
    errors[key]?.[0] ? <div className="form-error">{errors[key][0]}</div> : null;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__title">Create Account</div>

        {errors.non_field_errors && (
          <div className="form-global-error">{errors.non_field_errors[0]}</div>
        )}

        <form onSubmit={handleSubmit}>
          {[
            { name: 'username', label: 'Username', type: 'text', autoComplete: 'username' },
            { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
            { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
            { name: 'password2', label: 'Confirm Password', type: 'password', autoComplete: 'new-password' },
          ].map(f => (
            <div className="form-group" key={f.name}>
              <label htmlFor={f.name}>{f.label}</label>
              <input
                id={f.name} name={f.name} type={f.type}
                value={form[f.name]} onChange={handleChange}
                autoComplete={f.autoComplete} required
              />
              {fieldError(f.name)}
            </div>
          ))}

          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <div className="auth-redirect">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}