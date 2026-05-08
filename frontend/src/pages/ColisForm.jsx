import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { axios } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Package } from 'lucide-react';

export default function ColisForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [tarif, setTarif] = useState({ tarif_par_kg: 500, devise: 'FCFA' });
  const [form, setForm] = useState({
    expediteur_nom: '', expediteur_telephone: '', expediteur_adresse: '',
    destinataire_nom: '', destinataire_telephone: '', destinataire_adresse: '',
    description: '', poids: '', destination: '', origine: '',
    mode_paiement: 'destination'
  });

  useEffect(() => {
    axios.get('/parametres/').then(r => {
      setTarif({ tarif_par_kg: parseFloat(r.data.tarif_par_kg), devise: r.data.devise });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit) {
      axios.get(`/colis/${id}`).then(r => {
        const c = r.data;
        setForm({
          expediteur_nom: c.expediteur_nom, expediteur_telephone: c.expediteur_telephone,
          expediteur_adresse: c.expediteur_adresse || '',
          destinataire_nom: c.destinataire_nom, destinataire_telephone: c.destinataire_telephone,
          destinataire_adresse: c.destinataire_adresse || '',
          description: c.description || '', poids: c.poids,
          destination: c.destination, origine: c.origine,
          mode_paiement: c.facture?.mode_paiement || 'destination'
        });
      }).catch(() => toast.error('Colis non trouvé'));
    }
  }, [id]);

  function set(field, val) { setForm(p => ({ ...p, [field]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await axios.put(`/colis/${id}`, form);
        toast.success('Colis mis à jour');
      } else {
        const r = await axios.post('/colis/', form);
        toast.success(`Colis créé — Tracking: ${r.data.numero_tracking}`);
        navigate(`/colis/${r.data.id}`);
        return;
      }
      navigate('/colis');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  const montant = form.poids ? (parseFloat(form.poids) * tarif.tarif_par_kg).toLocaleString() : '-';

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2>{isEdit ? 'Modifier le colis' : 'Nouveau colis'}</h2>
            <p>{isEdit ? 'Modifier les informations du colis' : 'Enregistrer un nouveau colis'}</p>
          </div>
        </div>
      </div>

      <div className="page-body">
        <form onSubmit={handleSubmit} style={{ maxWidth: 800 }}>
          {/* Expéditeur */}
          <div className="form-section">
            <div className="form-section-title">📤 Expéditeur</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nom complet *</label>
                <input className="form-control" value={form.expediteur_nom} onChange={e => set('expediteur_nom', e.target.value)} required placeholder="Jean Dupont" />
              </div>
              <div className="form-group">
                <label className="form-label">Téléphone *</label>
                <input className="form-control" value={form.expediteur_telephone} onChange={e => set('expediteur_telephone', e.target.value)} required placeholder="+228 90 00 00 00" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Adresse</label>
              <input className="form-control" value={form.expediteur_adresse} onChange={e => set('expediteur_adresse', e.target.value)} placeholder="Rue, quartier, ville" />
            </div>
          </div>

          {/* Destinataire */}
          <div className="form-section">
            <div className="form-section-title">📥 Destinataire</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nom complet *</label>
                <input className="form-control" value={form.destinataire_nom} onChange={e => set('destinataire_nom', e.target.value)} required placeholder="Marie Martin" />
              </div>
              <div className="form-group">
                <label className="form-label">Téléphone *</label>
                <input className="form-control" value={form.destinataire_telephone} onChange={e => set('destinataire_telephone', e.target.value)} required placeholder="+228 91 00 00 00" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Adresse de livraison</label>
              <input className="form-control" value={form.destinataire_adresse} onChange={e => set('destinataire_adresse', e.target.value)} placeholder="Rue, quartier, ville" />
            </div>
          </div>

          {/* Colis */}
          <div className="form-section">
            <div className="form-section-title">📦 Informations du colis</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Origine (ville de départ) *</label>
                <input className="form-control" value={form.origine} onChange={e => set('origine', e.target.value)} required placeholder="Lomé" />
              </div>
              <div className="form-group">
                <label className="form-label">Destination *</label>
                <input className="form-control" value={form.destination} onChange={e => set('destination', e.target.value)} required placeholder="Kara" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Poids (kg) *</label>
                <input className="form-control" type="number" step="0.1" min="0.1" value={form.poids} onChange={e => set('poids', e.target.value)} required placeholder="5.5" />
              </div>
              <div className="form-group">
                <label className="form-label">Mode de paiement *</label>
                <select className="form-control" value={form.mode_paiement} onChange={e => set('mode_paiement', e.target.value)}>
                  <option value="depart">Paiement au départ</option>
                  <option value="destination">Paiement à destination</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description du contenu</label>
              <input className="form-control" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Ex: Vêtements, électroménager, documents..." />
            </div>
          </div>

          {/* Résumé facturation */}
          {form.poids && (
            <div style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: 'Syne', fontWeight: 700, color: 'var(--primary)' }}>Montant de la facture</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {form.poids} kg × {tarif.tarif_par_kg.toLocaleString()} {tarif.devise}/kg
                  </div>
                </div>
                <div style={{ fontFamily: 'Syne', fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {montant} <span style={{ fontSize: '0.9rem' }}>{tarif.devise}</span>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={16} />
              {loading ? 'Enregistrement...' : (isEdit ? 'Mettre à jour' : 'Enregistrer le colis')}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
