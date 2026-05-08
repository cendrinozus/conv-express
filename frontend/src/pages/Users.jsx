import React, { useEffect, useState } from 'react';
import { axios } from '../context/AuthContext';
import { Plus, Users, Shield, Truck, User } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = { admin: { label: 'Admin', icon: Shield, color: 'var(--red)' }, convoyeur: { label: 'Convoyeur', icon: Truck, color: 'var(--blue-light)' }, client: { label: 'Client', icon: User, color: 'var(--text-muted)' } };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '', password: '', role: 'convoyeur' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try {
      const r = await axios.get('/auth/users');
      setUsers(r.data);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/auth/register', form);
      toast.success('Utilisateur créé');
      setModal(false);
      setForm({ nom: '', prenom: '', email: '', telephone: '', password: '', role: 'convoyeur' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActif(userId, actif) {
    try {
      await axios.put(`/auth/users/${userId}`, { actif: !actif });
      fetchUsers();
      toast.success('Mise à jour effectuée');
    } catch {
      toast.error('Erreur');
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>Gestion des utilisateurs</h2>
        <p>{users.length} utilisateurs enregistrés</p>
      </div>

      <div className="page-body">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <Plus size={16} /> Nouvel utilisateur
          </button>
        </div>

        <div className="card">
          {loading ? <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div> : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Rôle</th>
                    <th>Statut</th>
                    <th>Créé le</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const role = ROLES[u.role] || ROLES.client;
                    const RoleIcon = role.icon;
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-glow)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 700, fontSize: '0.8rem', color: 'var(--primary)' }}>
                              {u.nom[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{u.nom} {u.prenom}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.email}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.telephone || '-'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <RoleIcon size={14} color={role.color} />
                            <span style={{ color: role.color, fontWeight: 600, fontSize: '0.85rem' }}>{role.label}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${u.actif ? 'badge-paye' : 'badge-non_paye'}`}>
                            {u.actif ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {new Date(u.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td>
                          <button className={`btn btn-sm ${u.actif ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleActif(u.id, u.actif)}>
                            {u.actif ? 'Désactiver' : 'Activer'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              Nouvel utilisateur
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nom *</label>
                  <input className="form-control" value={form.nom} onChange={e => setForm(p => ({...p, nom: e.target.value}))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Prénom</label>
                  <input className="form-control" value={form.prenom} onChange={e => setForm(p => ({...p, prenom: e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" className="form-control" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Téléphone</label>
                  <input className="form-control" value={form.telephone} onChange={e => setForm(p => ({...p, telephone: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rôle *</label>
                  <select className="form-control" value={form.role} onChange={e => setForm(p => ({...p, role: e.target.value}))}>
                    <option value="convoyeur">Convoyeur</option>
                    <option value="admin">Admin</option>
                    <option value="client">Client</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Mot de passe *</label>
                <input type="password" className="form-control" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} required minLength={6} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Création...' : 'Créer l\'utilisateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
