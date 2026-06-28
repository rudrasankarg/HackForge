import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../utils/toast';
import { fmt } from '../../utils/formatters';
import { ShieldCheck, ShieldAlert, Shield, Search, ExternalLink, Mail, UserCheck, X } from 'lucide-react';
import SkeletonCard from '../../components/SkeletonCard';
import EmptyState from '../../components/EmptyState';

export default function AdminOrganizers() {
  const { user } = useAuth();
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // pending, approved, rejected, all
  const [selectedIdCard, setSelectedIdCard] = useState(null); // for lightbox modal

  const fetchOrganizers = () => {
    setLoading(true);
    api.get('/organizers')
      .then(setOrganizers)
      .catch((err) => toast.error(err.message || 'Failed to fetch organizers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const handleApprove = async (id) => {
    try {
      const res = await api.post(`/organizers/${id}/approve`);
      toast.success(res.message || 'Organizer approved successfully.');
      fetchOrganizers();
    } catch (err) {
      toast.error(err.message || 'Approval failed.');
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await api.post(`/organizers/${id}/reject`);
      toast.success(res.message || 'Organizer rejected successfully.');
      fetchOrganizers();
    } catch (err) {
      toast.error(err.message || 'Rejection failed.');
    }
  };

  const handleSuspend = async (id) => {
    try {
      const res = await api.post(`/organizers/${id}/suspend`);
      toast.success(res.message || 'Organizer suspended successfully.');
      fetchOrganizers();
    } catch (err) {
      toast.error(err.message || 'Suspension failed.');
    }
  };

  const handleUnsuspend = async (id) => {
    try {
      const res = await api.post(`/organizers/${id}/unsuspend`);
      toast.success(res.message || 'Organizer activated successfully.');
      fetchOrganizers();
    } catch (err) {
      toast.error(err.message || 'Activation failed.');
    }
  };

  const filtered = organizers.filter((org) => {
    // Search filter
    const matchesSearch = 
      org.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      org.name?.toLowerCase().includes(search.toLowerCase()) ||
      org.email?.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab === 'all') return true;
    return org.verificationStatus === activeTab;
  });

  const getScoreBadge = (score) => {
    if (score === null || score === undefined) {
      return <span className="badge badge-muted">N/A AI Score</span>;
    }
    if (score >= 70) {
      return (
        <span className="badge badge-success" style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ShieldCheck size={12} /> {score}% Approved
        </span>
      );
    }
    if (score >= 40) {
      return (
        <span className="badge badge-warning" style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ShieldAlert size={12} /> {score}% Moderate Risk
        </span>
      );
    }
    return (
      <span className="badge badge-danger" style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <ShieldAlert size={12} /> {score}% High Risk
      </span>
    );
  };

  // Stats calculation
  const totalPending = organizers.filter(o => o.verificationStatus === 'pending').length;
  const totalApproved = organizers.filter(o => o.verificationStatus === 'approved').length;
  const totalRejected = organizers.filter(o => o.verificationStatus === 'rejected').length;
  const totalSuspended = organizers.filter(o => o.verificationStatus === 'suspended').length;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header flex-between">
          <div>
            <h1 className="page-title">Organizer Validation</h1>
            <p className="page-subtitle">Manage company profiles, employee verification, and AI registration screening logs.</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid-3" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{totalPending}</div>
            <div className="stat-label">Pending Approval</div>
            <div className="stat-sub">Require verification review</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--success)' }}>{totalApproved}</div>
            <div className="stat-label">Approved Partners</div>
            <div className="stat-sub">Active hackathon organizers</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{totalRejected}</div>
            <div className="stat-label">Rejected Applications</div>
            <div className="stat-sub">Flagged / failed screening</div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="card card-sm" style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              className="form-input" 
              style={{ paddingLeft: 36 }} 
              placeholder="Search by company, name, or email..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'pending', label: `Pending (${totalPending})` },
              { id: 'approved', label: 'Approved' },
              { id: 'suspended', label: `Suspended (${totalSuspended})` },
              { id: 'rejected', label: 'Rejected' },
              { id: 'all', label: 'All' }
            ].map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} type="list" height={160} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((org) => (
              <div 
                key={org._id} 
                className="card" 
                style={{ 
                  padding: 24, 
                  background: 'var(--bg-surface)', 
                  border: `1px solid ${org.verificationStatus === 'pending' ? 'var(--orange-border, #fed7aa)' : 'var(--border)'}` 
                }}
              >
                {/* Header Row */}
                <div className="flex-between" style={{ marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4, fontFamily: 'Sora, sans-serif' }}>
                      {org.companyName}
                    </h3>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      {org.website && (
                        <a href={org.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--brand, #ea580c)', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 600 }}>
                          <ExternalLink size={12} /> visit website
                        </a>
                      )}
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Registered: {fmt.datetime(org.createdAt)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {getScoreBadge(org.aiVerificationScore)}
                    
                    {org.verificationStatus === 'approved' && <span className="badge badge-success">Approved</span>}
                    {org.verificationStatus === 'rejected' && <span className="badge badge-danger">Rejected</span>}
                    {org.verificationStatus === 'pending' && <span className="badge badge-warning">Pending Review</span>}
                    {org.verificationStatus === 'suspended' && <span className="badge badge-danger">Suspended</span>}
                  </div>
                </div>

                {/* Details Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: org.verificationStatus === 'pending' ? 16 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Contact Representative</div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{org.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <Mail size={13} style={{ color: 'var(--text-muted)' }} /> {org.email}
                      </div>
                    </div>
                    {org.employeeId && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Employee Verification</div>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                          ID: <strong style={{ color: 'var(--text-primary)' }}>{org.employeeId}</strong>
                        </div>
                      </div>
                    )}
                    {org.companyDescription && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Organization Bio</div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{org.companyDescription}</p>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {org.idCardImage && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Employee ID Image</div>
                        <div 
                          onClick={() => setSelectedIdCard(org.idCardImage)}
                          style={{ 
                            border: '1px solid var(--border)', 
                            borderRadius: 8, 
                            padding: 6, 
                            background: 'var(--bg-elevated)', 
                            display: 'inline-block', 
                            cursor: 'pointer',
                            transition: 'opacity 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
                          onMouseLeave={e => e.currentTarget.style.opacity = 1}
                        >
                          <img src={org.idCardImage} alt="ID Card" style={{ maxHeight: 90, borderRadius: 4, objectFit: 'contain' }} />
                        </div>
                      </div>
                    )}

                    <div style={{ flex: 1, padding: '16px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Gemini Screening Assessment</div>
                      {org.aiVerificationNotes ? (
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>
                          "{org.aiVerificationNotes}"
                        </p>
                      ) : (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>No AI screening notes generated.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {org.verificationStatus === 'pending' && (
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={() => handleReject(org._id)}
                    >
                      Reject Application
                    </button>
                    <button 
                      className="btn btn-success btn-sm" 
                      onClick={() => handleApprove(org._id)}
                    >
                      Approve Organizer
                    </button>
                  </div>
                )}
                {org.verificationStatus === 'approved' && user?.role === 'admin' && (
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={() => handleSuspend(org._id)}
                    >
                      Suspend Organizer
                    </button>
                  </div>
                )}
                {org.verificationStatus === 'suspended' && user?.role === 'admin' && (
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
                    <button 
                      className="btn btn-success btn-sm" 
                      onClick={() => handleUnsuspend(org._id)}
                    >
                      Unsuspend / Activate
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {filtered.length === 0 && (
              <EmptyState 
                title="No Organizer Profiles Found" 
                subtitle="No organizer applications match the search filter or active tab."
                icon="Shield"
              />
            )}
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {selectedIdCard && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 20, right: 20 }}>
            <button onClick={() => setSelectedIdCard(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          </div>
          <div style={{ padding: 20, maxWidth: '90%', maxHeight: '90%' }}>
            <img src={selectedIdCard} alt="ID card full" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
          </div>
        </div>
      )}
    </div>
  );
}
