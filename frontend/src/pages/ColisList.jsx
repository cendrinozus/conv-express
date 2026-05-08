import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { axios, useAuth } from '../context/AuthContext';
import { Plus, Search, RefreshCw, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUTS = ['', 'recu', 'en_transit', 'arrive', 'livre'];
const STATUT_LABELS = { recu: 'Reçu', en_transit: 'En transit', arrive: 'Arrivé', livre: 'Livré' };

export default function ColisList() {
  const { user } = useAuth();
  const [colis, setColis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => { fetchColis(); }, [search, statut]);

  async function fetchColis() {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statut) params.statut = statut;
      const r = await axios.get('/colis/', { params });
      setColis(r.data);
    } catch (e) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatut(id, newStatut) {
    setUpdating(id);
    try {
      await axios.patch(`/colis/${id}/statut`, { statut: newStatut });
      toast.success('Statut mis à jour');
      fetchColis();
    } catch {
      toast.error('Erreur');
    } finally {
      setUpdating(null);
    }
  }

  const NEXT_STATUT = { recu: 'en_transit', en_transit: 'arrive', arrive: 'livre' };

  return (
    <>
      <div className="page-header">
        <h2>Gestion des colis</h2>
        <p>{colis.length} colis {statut ? `(${STATUT_LABELS[statut]})` : 'au total'}</p>
      </div>

      <div className="page-body">
        <div className="filters-bar">
          <div className="search-wrapper">
            <Search size={16} />
            <input
              className="search-input"
              placeholder="Rechercher tracking, expéditeur, destinataire..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="form-control" style={{ width: 'auto' }} value={statut} onChange={e => setStatut(e.target.value)}>
            <option value="">Tous les statuts</option>
            {STATUTS.slice(1).map(s => (
              <option key={s} value={s}>{STATUT_LABELS[s]}</option>
            ))}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={fetchColis}>
            <RefreshCw size={14} />
          </button>
          {(user?.role === 'admin' || user?.role === 'convoyeur') && (
            <Link to="/colis/nouveau" className="btn btn-primary">
              <Plus size={16} /> Nouveau colis
            </Link>
          )}
        </div>

        <div className="card">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : colis.length === 0 ? (
            <div className="empty-state">
              <Package size={48} />
              <h3>Aucun colis trouvé</h3>
              <p>Essayez de modifier vos filtres</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Tracking</th>
                    <th>Expéditeur</th>
                    <th>Destinataire</th>
                    <th>Trajet</th>
                    <th>Poids</th>
                    <th>Statut</th>
                    <th>Paiement</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {colis.map(c => (
                    <tr key={c.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 700 }}>
                          {c.numero_tracking}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.expediteur_nom}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.expediteur_telephone}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.destinataire_nom}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.destinataire_telephone}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem' }}>{c.origine}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>→ {c.destination}</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{c.poids} kg</td>
                      <td><span className={`badge badge-${c.statut}`}>{STATUT_LABELS[c.statut]}</span></td>
                      <td>
                        {c.facture && (
                          <span className={`badge badge-${c.facture.statut_paiement}`}>
                            {c.facture.statut_paiement === 'paye' ? 'Payé' : 'Non payé'}
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {new Date(c.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link to={`/colis/${c.id}`} className="btn btn-secondary btn-sm">Détail</Link>
                          {(user?.role === 'admin' || user?.role === 'convoyeur') && NEXT_STATUT[c.statut] && (
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={updating === c.id}
                              onClick={() => updateStatut(c.id, NEXT_STATUT[c.statut])}
                            >
                              {updating === c.id ? '...' : `→ ${STATUT_LABELS[NEXT_STATUT[c.statut]]}`}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
