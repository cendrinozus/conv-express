import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { axios } from '../context/AuthContext';
import { Search, FileText, Download, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FacturesList() {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtre, setFiltre] = useState('');

  useEffect(() => { fetchFactures(); }, []);

  async function fetchFactures() {
    setLoading(true);
    try {
      const r = await axios.get('/factures/');
      setFactures(r.data);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  const filtered = factures.filter(f => {
    const q = search.toLowerCase();
    const match = !q || f.numero_facture.toLowerCase().includes(q) ||
      f.colis?.expediteur_nom?.toLowerCase().includes(q) ||
      f.colis?.destinataire_nom?.toLowerCase().includes(q) ||
      f.colis?.numero_tracking?.toLowerCase().includes(q);
    const statutMatch = !filtre || f.statut_paiement === filtre;
    return match && statutMatch;
  });

  async function downloadPDF(id, numero) {
    try {
      const r = await axios.get(`/factures/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture_${numero}.pdf`;
      a.click();
    } catch {
      toast.error('Erreur génération PDF');
    }
  }

  const totalMontant = filtered.reduce((s, f) => s + f.montant_total, 0);
  const totalPercu = filtered.filter(f => f.statut_paiement === 'paye').reduce((s, f) => s + f.montant_total, 0);

  return (
    <>
      <div className="page-header">
        <h2>Factures</h2>
        <p>{filtered.length} factures — Perçu: {totalPercu.toLocaleString()} FCFA / {totalMontant.toLocaleString()} FCFA</p>
      </div>

      <div className="page-body">
        <div className="filters-bar">
          <div className="search-wrapper">
            <Search size={16} />
            <input className="search-input" placeholder="Rechercher par numéro, client..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{ width: 'auto' }} value={filtre} onChange={e => setFiltre(e.target.value)}>
            <option value="">Tous</option>
            <option value="non_paye">Non payées</option>
            <option value="paye">Payées</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={fetchFactures}><RefreshCw size={14} /></button>
        </div>

        <div className="card">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <h3>Aucune facture</h3>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>N° Facture</th>
                    <th>Tracking</th>
                    <th>Client</th>
                    <th>Trajet</th>
                    <th>Poids</th>
                    <th>Montant</th>
                    <th>Mode paiement</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(f => (
                    <tr key={f.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem' }}>
                        {f.numero_facture}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {f.colis?.numero_tracking}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{f.colis?.expediteur_nom}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>→ {f.colis?.destinataire_nom}</div>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {f.colis?.origine} → {f.colis?.destination}
                      </td>
                      <td>{f.poids} kg</td>
                      <td style={{ fontFamily: 'Syne', fontWeight: 700 }}>
                        {f.montant_total.toLocaleString()} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{f.devise}</span>
                      </td>
                      <td><span className={`badge badge-${f.mode_paiement}`}>{f.mode_paiement === 'depart' ? 'Départ' : 'Destination'}</span></td>
                      <td><span className={`badge badge-${f.statut_paiement}`}>{f.statut_paiement === 'paye' ? 'Payé' : 'Non payé'}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {new Date(f.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link to={`/factures/${f.id}`} className="btn btn-secondary btn-sm">Voir</Link>
                          <button className="btn btn-ghost btn-sm" onClick={() => downloadPDF(f.id, f.numero_facture)} title="Télécharger PDF">
                            <Download size={14} />
                          </button>
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
