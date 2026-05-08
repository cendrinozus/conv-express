import React, { useEffect, useState } from 'react';
import { axios } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Settings, Save } from 'lucide-react';

const DEVISES = ['FCFA', 'XOF', 'EUR', 'USD', 'GNF', 'CDF'];

export default function Parametres() {
  const [form, setForm] = useState({ tarif_par_kg: '', devise: 'FCFA' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get('/parametres/').then(r => {
      setForm({ tarif_par_kg: r.data.tarif_par_kg, devise: r.data.devise });
    }).catch(() => {
      toast.error('Erreur chargement paramètres');
    }).finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put('/parametres/', form);
      toast.success('Paramètres enregistrés');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Paramètres</h2>
          <p>Configuration générale de l'application</p>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: 560 }}>
        <div className="card">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={18} /> Tarification
          </div>

          <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
            <div className="form-group">
              <label className="form-label">Prix par kg *</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="number"
                  className="form-control"
                  style={{ flex: 1 }}
                  min="1"
                  step="0.01"
                  value={form.tarif_par_kg}
                  onChange={e => setForm(p => ({ ...p, tarif_par_kg: e.target.value }))}
                  required
                  placeholder="500"
                />
                <select
                  className="form-control"
                  style={{ width: 110 }}
                  value={form.devise}
                  onChange={e => setForm(p => ({ ...p, devise: e.target.value }))}
                >
                  {DEVISES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6 }}>
                Ce tarif sera appliqué automatiquement à chaque nouveau colis enregistré.
              </p>
            </div>

            <div style={{
              background: 'var(--bg-hover)', borderRadius: 8,
              padding: '12px 16px', marginBottom: 20,
              fontSize: '0.85rem', color: 'var(--text-muted)'
            }}>
              Tarif actuel&nbsp;: <strong style={{ color: 'var(--primary)' }}>
                {Number(form.tarif_par_kg).toLocaleString()} {form.devise} / kg
              </strong>
              <br />
              Exemple — colis de 3 kg&nbsp;:&nbsp;
              <strong style={{ color: 'var(--text)' }}>
                {(Number(form.tarif_par_kg) * 3).toLocaleString()} {form.devise}
              </strong>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
