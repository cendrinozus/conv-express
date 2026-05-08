import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Package, Lock, Mail, Truck, Shield, BarChart3 } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
      toast.success('Connexion réussie');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Truck size={40} color="var(--primary)" />
          </div>
          <h1>Convoyage<br /><span>Express</span></h1>
          <p>Plateforme de gestion<br />de transport et livraison de colis</p>

          <div className="login-features">
            <div className="feature-item">
              <div className="feature-icon"><Package size={18} /></div>
              <span>Enregistrement et suivi de colis en temps réel</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><BarChart3 size={18} /></div>
              <span>Facturation automatique au poids</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><Shield size={18} /></div>
              <span>Paiement sécurisé au départ ou à destination</span>
            </div>
          </div>

          <div style={{ marginTop: 48, padding: '14px 18px', background: 'rgba(249,115,22,0.08)', borderRadius: 10, border: '1px solid rgba(249,115,22,0.2)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>Compte démo admin</p>
            <code style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>admin@convoyage.com / admin123</code>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-container">
          <h2>Connexion</h2>
          <p>Accédez à votre espace de gestion</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Adresse email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: 38 }}
                  placeholder="votre@email.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: 38 }}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Suivre un colis ?{' '}
            <a href="/tracking" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
              Accès public →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
