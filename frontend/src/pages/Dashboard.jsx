import React, { useEffect, useState } from 'react';
import { useAuth, axios } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Package, TrendingUp, CheckCircle, Clock, Truck, DollarSign, AlertCircle, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/dashboard/stats')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const statCards = [
    { label: 'Total colis', value: stats?.colis?.total || 0, icon: Package, accent: 'var(--primary)' },
    { label: 'En transit', value: stats?.colis?.en_transit || 0, icon: Truck, accent: 'var(--blue-light)' },
    { label: 'Arrivés', value: stats?.colis?.arrive || 0, icon: CheckCircle, accent: 'var(--purple)' },
    { label: 'Livrés', value: stats?.colis?.livre || 0, icon: TrendingUp, accent: 'var(--green)' },
    { label: 'Montant perçu', value: `${(stats?.finances?.montant_percu || 0).toLocaleString()} FCFA`, icon: DollarSign, accent: 'var(--green)', wide: true },
    { label: 'En attente', value: `${(stats?.finances?.montant_en_attente || 0).toLocaleString()} FCFA`, icon: AlertCircle, accent: 'var(--yellow)', wide: true },
  ];

  const STATUT_COLORS = {
    recu: 'var(--yellow)',
    en_transit: 'var(--blue-light)',
    arrive: 'var(--purple)',
    livre: 'var(--green)'
  };

  return (
    <>
      <div className="page-header">
        <h2>Tableau de bord</h2>
        <p>Bienvenue, {user?.nom} — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          {statCards.map((s, i) => (
            <div className="stat-card" key={i} style={{ '--accent': s.accent, gridColumn: s.wide ? 'span 1' : 'span 1' }}>
              <s.icon size={32} className="stat-icon" />
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Activité semaine */}
          <div className="card">
            <div className="card-title">Activité — 7 derniers jours</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats?.activite_semaine || []} barSize={24}>
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {(stats?.activite_semaine || []).map((_, i) => (
                    <Cell key={i} fill={i === 6 ? 'var(--primary)' : 'var(--border)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Répartition statuts */}
          <div className="card">
            <div className="card-title">Répartition des statuts</div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { key: 'recu', label: 'Reçus', val: stats?.colis?.recu || 0 },
                { key: 'en_transit', label: 'En transit', val: stats?.colis?.en_transit || 0 },
                { key: 'arrive', label: 'Arrivés', val: stats?.colis?.arrive || 0 },
                { key: 'livre', label: 'Livrés', val: stats?.colis?.livre || 0 },
              ].map(s => {
                const pct = stats?.colis?.total ? Math.round((s.val / stats.colis.total) * 100) : 0;
                return (
                  <div key={s.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                      <span style={{ fontWeight: 600 }}>{s.val} <span style={{ color: 'var(--text-muted)' }}>({pct}%)</span></span>
                    </div>
                    <div style={{ background: 'var(--border)', borderRadius: 4, height: 6 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: STATUT_COLORS[s.key], borderRadius: 4, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Derniers colis */}
        <div className="card" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="card-title" style={{ margin: 0 }}>Derniers colis enregistrés</div>
            {(user?.role === 'admin' || user?.role === 'convoyeur') && (
              <Link to="/colis/nouveau" className="btn btn-primary btn-sm">
                <Plus size={14} /> Nouveau colis
              </Link>
            )}
          </div>
          {(stats?.derniers_colis || []).length === 0 ? (
            <div className="empty-state">
              <Package size={48} />
              <h3>Aucun colis</h3>
              <p>Commencez par enregistrer un nouveau colis</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Tracking</th>
                    <th>Expéditeur</th>
                    <th>Destinataire</th>
                    <th>Destination</th>
                    <th>Poids</th>
                    <th>Statut</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.derniers_colis.map(c => (
                    <tr key={c.id}>
                      <td>
                        <Link to={`/colis/${c.id}`} style={{ color: 'var(--primary)', fontFamily: 'monospace', fontWeight: 600, textDecoration: 'none' }}>
                          {c.numero_tracking}
                        </Link>
                      </td>
                      <td>{c.expediteur_nom}</td>
                      <td>{c.destinataire_nom}</td>
                      <td>{c.destination}</td>
                      <td>{c.poids} kg</td>
                      <td><span className={`badge badge-${c.statut}`}>{c.statut.replace('_', ' ')}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {new Date(c.created_at).toLocaleDateString('fr-FR')}
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
