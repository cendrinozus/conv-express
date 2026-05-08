import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { axios, useAuth } from '../context/AuthContext';
import { ArrowLeft, Download, CreditCard, CheckCircle, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FactureDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [facture, setFacture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ paye_par: '', notes: '' });
  const [paying, setPaying] = useState(false);

  useEffect(() => { fetchFacture(); }, [id]);

  async function fetchFacture() {
    try {
      const r = await axios.get(`/factures/${id}`);
      setFacture(r.data);
    } catch {
      toast.error('Facture non trouvée');
      navigate('/factures');
    } finally {
      setLoading(false);
    }
  }

  async function downloadPDF() {
    try {
      const r = await axios.get(`/factures/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${facture.numero_facture}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Erreur PDF');
    }
  }

  async function downloadRecu() {
    try {
      const r = await axios.get(`/paiements/recu/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `recu-${facture.numero_facture}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Erreur reçu');
    }
  }

  async function handlePay(e) {
    e.preventDefault();
    setPaying(true);
    try {
      const r = await axios.post(`/paiements/payer/${id}`, payForm);
      setFacture(r.data.facture);
      setPayModal(false);
      toast.success('Paiement enregistré !');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setPaying(false);
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!facture) return null;

  const colis = facture.colis;

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
          <div>
            <h2>Facture {facture.numero_facture}</h2>
            <p>Créée le {new Date(facture.created_at).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: 800 }}>
        {/* Statut */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: facture.statut_paiement === 'paye' ? 'var(--green-bg)' : 'var(--red-bg)',
          border: `1px solid ${facture.statut_paiement === 'paye' ? 'var(--green)' : 'var(--red)'}`,
          borderRadius: 10, padding: '14px 20px', marginBottom: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={20} color={facture.statut_paiement === 'paye' ? 'var(--green)' : 'var(--red)'} />
            <span style={{ fontWeight: 700, color: facture.statut_paiement === 'paye' ? 'var(--green)' : 'var(--red)' }}>
              {facture.statut_paiement === 'paye' ? `Payé par ${facture.paye_par}` : 'Non payé'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={downloadPDF}>
              <Download size={14} /> Facture PDF
            </button>
            {facture.statut_paiement === 'paye' && (
              <button className="btn btn-success btn-sm" onClick={downloadRecu}>
                <Receipt size={14} /> Reçu de paiement
              </button>
            )}
            {facture.statut_paiement !== 'paye' && (user?.role === 'admin' || user?.role === 'convoyeur') && (
              <button className="btn btn-success btn-sm" onClick={() => setPayModal(true)}>
                <CreditCard size={14} /> Enregistrer paiement
              </button>
            )}
          </div>
        </div>

        {/* Détails */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="card">
            <div className="card-title">Expéditeur</div>
            <div style={{ fontWeight: 700 }}>{colis?.expediteur_nom}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{colis?.expediteur_telephone}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{colis?.expediteur_adresse}</div>
          </div>
          <div className="card">
            <div className="card-title">Destinataire</div>
            <div style={{ fontWeight: 700 }}>{colis?.destinataire_nom}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{colis?.destinataire_telephone}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{colis?.destinataire_adresse}</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">Colis — <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{colis?.numero_tracking}</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 12 }}>
            {[
              ['Trajet', `${colis?.origine} → ${colis?.destination}`],
              ['Description', colis?.description || '-'],
              ['Statut colis', colis?.statut?.replace('_', ' ')],
            ].map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{l}</div>
                <div style={{ fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Détail de facturation</div>
          <table style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Description</th>
                <th>Poids</th>
                <th>Tarif/kg</th>
                <th style={{ textAlign: 'right' }}>Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Transport de colis</td>
                <td>{facture.poids} kg</td>
                <td>{facture.tarif_kg.toLocaleString()} {facture.devise}</td>
                <td style={{ textAlign: 'right', fontFamily: 'Syne', fontWeight: 700 }}>
                  {facture.montant_total.toLocaleString()} {facture.devise}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700, paddingTop: 12, borderTop: '2px solid var(--border)' }}>
                  TOTAL DÛ
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'Syne', fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', paddingTop: 12, borderTop: '2px solid var(--border)' }}>
                  {facture.montant_total.toLocaleString()} {facture.devise}
                </td>
              </tr>
            </tfoot>
          </table>
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: 8 }}>
            <span className={`badge badge-${facture.mode_paiement}`}>
              Paiement {facture.mode_paiement === 'depart' ? 'au départ' : 'à destination'}
            </span>
          </div>
        </div>
      </div>

      {/* Modal paiement */}
      {payModal && (
        <div className="modal-overlay" onClick={() => setPayModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              Enregistrer le paiement
              <button className="btn btn-ghost btn-sm" onClick={() => setPayModal(false)}>✕</button>
            </div>
            <div style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Montant à encaisser</div>
              <div style={{ fontFamily: 'Syne', fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
                {facture.montant_total.toLocaleString()} {facture.devise}
              </div>
            </div>
            <form onSubmit={handlePay}>
              <div className="form-group">
                <label className="form-label">Nom du payeur *</label>
                <input className="form-control" value={payForm.paye_par} onChange={e => setPayForm(p => ({...p, paye_par: e.target.value}))} required placeholder="Nom de la personne qui paie" />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="form-control" value={payForm.notes} onChange={e => setPayForm(p => ({...p, notes: e.target.value}))} placeholder="Optionnel..." />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setPayModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-success" disabled={paying}>
                  <CheckCircle size={16} /> {paying ? 'Enregistrement...' : 'Confirmer le paiement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
