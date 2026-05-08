import React, { useState } from 'react';
import { axios, useAuth } from '../context/AuthContext';
import { Search, CheckCircle, XCircle, Package, CreditCard, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Paiement() {
  const { user } = useAuth();
  const [numero, setNumero] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [payForm, setPayForm] = useState({ paye_par: '', notes: '' });
  const [paying, setPaying] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!numero.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await axios.get(`/paiements/verifier/${numero.trim().toUpperCase()}`);
      setResult(r.data);
      setPayForm({ paye_par: r.data.facture?.colis?.destinataire_nom || '', notes: '' });
    } catch (err) {
      if (err.response?.status === 404) {
        setResult({ valide: false, message: 'Facture introuvable' });
      } else {
        toast.error('Erreur lors de la vérification');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePay(e) {
    e.preventDefault();
    setPaying(true);
    try {
      const r = await axios.post(`/paiements/payer/${result.facture.id}`, payForm);
      toast.success('Paiement enregistré ! Le colis peut être remis.');
      // Refresh
      const r2 = await axios.get(`/paiements/verifier/${numero.trim().toUpperCase()}`);
      setResult(r2.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setPaying(false);
    }
  }

  const canPay = result?.valide && result.facture?.statut_paiement === 'non_paye' && (user?.role === 'admin' || user?.role === 'convoyeur');
  const canRetire = result?.valide && result.facture?.statut_paiement === 'paye' && result.colis?.statut === 'arrive';
  const alreadyDelivered = result?.colis?.statut === 'livre';

  return (
    <>
      <div className="page-header">
        <h2>Paiement & Retrait de colis</h2>
        <p>Vérifiez une facture pour encaisser un paiement ou autoriser le retrait</p>
      </div>

      <div className="page-body">
        <div style={{ maxWidth: 680 }}>
          {/* Recherche */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">Saisir le numéro de facture</div>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <input
                className="form-control"
                value={numero}
                onChange={e => setNumero(e.target.value)}
                placeholder="Ex: FAC-202403-ABCDE"
                style={{ fontFamily: 'monospace', letterSpacing: '1px', textTransform: 'uppercase' }}
              />
              <button type="submit" className="btn btn-primary" disabled={loading || !numero.trim()}>
                <Search size={16} />
                {loading ? 'Recherche...' : 'Vérifier'}
              </button>
            </form>
          </div>

          {/* Résultat */}
          {result && !result.valide && (
            <div className="card" style={{ borderColor: 'var(--red)', background: 'var(--red-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <XCircle size={24} color="var(--red)" />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--red)' }}>Facture introuvable</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Vérifiez le numéro et réessayez</div>
                </div>
              </div>
            </div>
          )}

          {result?.valide && (
            <>
              {/* Status banner */}
              <div className="card" style={{
                marginBottom: 16,
                borderColor: alreadyDelivered ? 'var(--green)' : result.facture?.statut_paiement === 'paye' ? 'var(--blue-light)' : 'var(--yellow)',
                background: alreadyDelivered ? 'var(--green-bg)' : result.facture?.statut_paiement === 'paye' ? 'rgba(88,166,255,0.05)' : 'var(--yellow-bg)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {alreadyDelivered
                    ? <CheckCircle size={28} color="var(--green)" />
                    : result.facture?.statut_paiement === 'paye'
                    ? <CheckCircle size={28} color="var(--blue-light)" />
                    : <AlertTriangle size={28} color="var(--yellow)" />
                  }
                  <div>
                    <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.05rem' }}>
                      {alreadyDelivered
                        ? 'Colis déjà livré'
                        : result.facture?.statut_paiement === 'paye'
                        ? 'Facture payée — Retrait autorisé'
                        : 'Facture non payée — Paiement requis'
                      }
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Facture: <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{result.facture?.numero_facture}</span>
                      {' · '}Tracking: <span style={{ fontFamily: 'monospace' }}>{result.colis?.numero_tracking}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Infos colis */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div className="card">
                  <div className="card-title">Expéditeur</div>
                  <div style={{ fontWeight: 700 }}>{result.colis?.expediteur_nom}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{result.colis?.expediteur_telephone}</div>
                </div>
                <div className="card">
                  <div className="card-title">Destinataire</div>
                  <div style={{ fontWeight: 700 }}>{result.colis?.destinataire_nom}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{result.colis?.destinataire_telephone}</div>
                </div>
              </div>

              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="card-title">Montant de la facture</div>
                    <div style={{ fontFamily: 'Syne', fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                      {result.facture?.montant_total?.toLocaleString()} <span style={{ fontSize: '1rem' }}>{result.facture?.devise}</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {result.facture?.poids} kg × {result.facture?.tarif_kg?.toLocaleString()} {result.facture?.devise}/kg
                      {' · '}Paiement {result.facture?.mode_paiement === 'depart' ? 'au départ' : 'à destination'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Statut colis</div>
                    <span className={`badge badge-${result.colis?.statut}`} style={{ fontSize: '0.85rem', padding: '5px 14px' }}>
                      {result.colis?.statut?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                {result.facture?.statut_paiement === 'paye' && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Payé par <strong>{result.facture.paye_par}</strong>
                    {result.facture.date_paiement && ` le ${new Date(result.facture.date_paiement).toLocaleString('fr-FR')}`}
                  </div>
                )}
              </div>

              {/* Formulaire paiement */}
              {canPay && (
                <div className="card" style={{ borderColor: 'var(--yellow)' }}>
                  <div className="card-title" style={{ color: 'var(--yellow)' }}>
                    <CreditCard size={14} style={{ display: 'inline', marginRight: 6 }} />
                    Encaisser le paiement
                  </div>
                  <form onSubmit={handlePay} style={{ marginTop: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Nom du payeur *</label>
                      <input className="form-control" value={payForm.paye_par} onChange={e => setPayForm(p => ({...p, paye_par: e.target.value}))} required placeholder="Nom complet" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Notes (optionnel)</label>
                      <input className="form-control" value={payForm.notes} onChange={e => setPayForm(p => ({...p, notes: e.target.value}))} placeholder="Numéro de reçu, observations..." />
                    </div>
                    <button type="submit" className="btn btn-success btn-lg" style={{ width: '100%' }} disabled={paying}>
                      <CreditCard size={18} />
                      {paying ? 'Enregistrement...' : `Confirmer le paiement de ${result.facture?.montant_total?.toLocaleString()} ${result.facture?.devise}`}
                    </button>
                  </form>
                </div>
              )}

              {/* Autorisation retrait */}
              {canRetire && !alreadyDelivered && (
                <div className="card" style={{ borderColor: 'var(--green)', background: 'var(--green-bg)', textAlign: 'center', padding: 28 }}>
                  <CheckCircle size={48} color="var(--green)" style={{ marginBottom: 12 }} />
                  <div style={{ fontFamily: 'Syne', fontSize: '1.3rem', fontWeight: 800, color: 'var(--green)' }}>
                    ✓ RETRAIT AUTORISÉ
                  </div>
                  <div style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                    Le colis peut être remis à {result.colis?.destinataire_nom}
                  </div>
                </div>
              )}

              {alreadyDelivered && (
                <div className="card" style={{ borderColor: 'var(--green)', textAlign: 'center', padding: 20 }}>
                  <div style={{ color: 'var(--green)', fontWeight: 700 }}>✓ Colis déjà livré et remis</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
