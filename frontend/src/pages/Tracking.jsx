import React, { useState } from 'react';
import { axios } from '../context/AuthContext';
import { Search, Package, Truck, MapPin, CheckCircle, Clock } from 'lucide-react';

const STATUT_STEPS = [
  { key: 'recu', label: 'Colis reçu', icon: Package, desc: 'Votre colis a été enregistré' },
  { key: 'en_transit', label: 'En transit', icon: Truck, desc: 'Votre colis est en route' },
  { key: 'arrive', label: 'Arrivé', icon: MapPin, desc: 'Votre colis est arrivé à destination' },
  { key: 'livre', label: 'Livré', icon: CheckCircle, desc: 'Votre colis a été remis' },
];

export default function Tracking() {
  const [numero, setNumero] = useState('');
  const [colis, setColis] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!numero.trim()) return;
    setLoading(true);
    setError('');
    setColis(null);
    try {
      const r = await axios.get(`/colis/tracking/${numero.trim().toUpperCase()}`);
      setColis(r.data);
    } catch {
      setError('Aucun colis trouvé avec ce numéro de tracking.');
    } finally {
      setLoading(false);
    }
  }

  const currentStepIdx = colis ? STATUT_STEPS.findIndex(s => s.key === colis.statut) : -1;

  return (
    <div className="tracking-page">
      <div className="tracking-card">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Truck size={28} color="var(--primary)" />
            <span style={{ fontFamily: 'Syne', fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
              Convoyage Express
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>Suivre mon colis</h1>
          <p style={{ color: 'var(--text-muted)' }}>Entrez votre numéro de tracking pour voir l'état de votre colis</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <input
            className="form-control"
            value={numero}
            onChange={e => setNumero(e.target.value)}
            placeholder="CVG12345678..."
            style={{ fontFamily: 'monospace', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '1rem' }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !numero.trim()}>
            <Search size={16} />
            {loading ? '...' : 'Suivre'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: 8, padding: '12px 16px', color: 'var(--red)', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {/* Result */}
        {colis && (
          <>
            {/* Tracking number */}
            <div style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
                Numéro de tracking
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '2px' }}>
                {colis.numero_tracking}
              </div>
            </div>

            {/* Parties */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div style={{ padding: '14px 16px', background: 'var(--bg-hover)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>De</div>
                <div style={{ fontWeight: 700 }}>{colis.expediteur_nom}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{colis.origine}</div>
              </div>
              <div style={{ padding: '14px 16px', background: 'var(--bg-hover)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>À</div>
                <div style={{ fontWeight: 700 }}>{colis.destinataire_nom}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{colis.destination}</div>
              </div>
            </div>

            {/* Timeline */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>
                Historique
              </div>
              <div className="timeline">
                {STATUT_STEPS.map((step, idx) => {
                  const done = idx < currentStepIdx;
                  const active = idx === currentStepIdx;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="timeline-item">
                      <div className={`timeline-dot ${active ? 'active' : done ? 'done' : ''}`}>
                        <Icon size={14} color={done ? 'var(--green)' : active ? 'var(--primary)' : 'var(--text-muted)'} />
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-label" style={{ color: done || active ? 'var(--text)' : 'var(--text-muted)' }}>
                          {step.label}
                        </div>
                        <div className="timeline-sub">{step.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Paiement */}
            {colis.facture && (
              <div style={{
                padding: '12px 16px', borderRadius: 8,
                background: colis.facture.statut_paiement === 'paye' ? 'var(--green-bg)' : 'var(--yellow-bg)',
                border: `1px solid ${colis.facture.statut_paiement === 'paye' ? 'var(--green)' : 'var(--yellow)'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 2 }}>Statut paiement</div>
                  <div style={{ fontWeight: 700, color: colis.facture.statut_paiement === 'paye' ? 'var(--green)' : 'var(--yellow)' }}>
                    {colis.facture.statut_paiement === 'paye' ? '✓ Payé' : '⚠ Paiement requis à la livraison'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.1rem' }}>
                    {colis.facture.montant_total?.toLocaleString()} {colis.facture.devise}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 28, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Agent ? <a href="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Accès espace agent →</a>
        </div>
      </div>
    </div>
  );
}
