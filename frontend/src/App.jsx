import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ColisList from './pages/ColisList';
import ColisForm from './pages/ColisForm';
import FacturesList from './pages/FacturesList';
import FactureDetail from './pages/FactureDetail';
import Paiement from './pages/Paiement';
import Tracking from './pages/Tracking';
import Users from './pages/Users';
import Parametres from './pages/Parametres';
import Layout from './components/Layout';
import './index.css';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/tracking" element={<Tracking />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="colis" element={<ColisList />} />
        <Route path="colis/nouveau" element={
          <PrivateRoute roles={['admin', 'convoyeur']}><ColisForm /></PrivateRoute>
        } />
        <Route path="colis/:id" element={<ColisForm />} />
        <Route path="factures" element={<FacturesList />} />
        <Route path="factures/:id" element={<FactureDetail />} />
        <Route path="paiement" element={<Paiement />} />
        <Route path="utilisateurs" element={
          <PrivateRoute roles={['admin']}><Users /></PrivateRoute>
        } />
        <Route path="parametres" element={
          <PrivateRoute roles={['admin']}><Parametres /></PrivateRoute>
        } />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          style: { borderRadius: '8px', background: '#1a1a2e', color: '#fff' }
        }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
