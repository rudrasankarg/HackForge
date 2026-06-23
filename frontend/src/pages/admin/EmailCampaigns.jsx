import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import Sidebar from '../../components/Sidebar';
import { toast } from '../../utils/toast';
import { fmt } from '../../utils/formatters';
import {
  Mail, Send, RefreshCw, Search, CheckCircle2,
  XCircle, AlertCircle, Calendar, TrendingUp, Clock,
  Target, ChevronLeft, ChevronRight, BarChart3, Inbox
} from 'lucide-react';

export default function EmailCampaigns() {
  const [stats, setStats] = useState(null);
  const [logsData, setLogsData] = useState({ logs: [], total: 0, page: 1, pages: 1 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [triggering, setTriggering] = useState(false);

  // Form State
  const [form, setForm] = useState({ audience: 'registered_no_team', subject: '', body: '' });

  // Logs Filter State
  const [filters, setFilters] = useState({ page: 1, limit: 10, search: '', status: '', campaignType: '' });

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/emails/analytics');
      setStats(res);
    } catch (err) {
      toast.error('Failed to load email analytics');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        status: filters.status,
        campaignType: filters.campaignType
      }).toString();
      const res = await api.get(`/emails/logs?${queryParams}`);
      setLogsData(res);
    } catch (err) {
      toast.error('Failed to load email telemetry logs');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const handleFilterChange = (k, v) => {
    setFilters(prev => ({ ...prev, [k]: v, page: k === 'page' ? v : 1 }));
  };

  const handleSendCustom = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.body.trim()) {
      return toast.warning('Subject and Body are required.');
    }
    setSubmitting(true);
    try {
      const res = await api.post('/emails/send-custom', form);
      toast.success(res.message || 'Custom email campaign sent successfully!');
      setForm({ audience: 'registered_no_team', subject: '', body: '' });
      fetchStats();
      fetchLogs();
    } catch (err) {
      toast.error(err.message || 'Failed to dispatch custom campaign.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriggerEngine = async () => {
    setTriggering(true);
    try {
      const res = await api.post('/emails/trigger-engine');
      toast.info(res.message || 'Campaign engine checks completed.');
      fetchStats();
      fetchLogs();
    } catch (err) {
      toast.error('Failed to trigger background campaign checks.');
    } finally {
      setTriggering(false);
    }
  };

  // UI Helpers
  const statusBadge = {
    sent: 'badge-info',
    failed: 'badge-danger',
    opened: 'badge-success',
    clicked: 'badge-primary'
  };

  const campaignNames = {
    welcome: 'Welcome Email',
    otp: 'OTP Verification',
    result: 'Hackathon Results',
    announcement: 'Custom Broadcast',
    journey_registered_no_team: 'Nudge: No Team Joined',
    journey_team_no_submission: 'Nudge: No Submission yet',
    journey_submitted: 'Submission Confirmation',
    journey_evaluation_complete: 'AI Evaluation Complete',
    journey_post_event: 'Post Event Summary'
  };

  const formatCampaignType = (type) => campaignNames[type] || type;

  const targetEngagement = 60.0;
  const openRate = stats?.openRate ?? 0;
  const clickRate = stats?.clickRate ?? 0;

  return (
    <div className="app-shell" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div className="page-header flex-between">
          <div>
            <h1 className="page-title">Email Campaigns & Analytics</h1>
            <p className="page-subtitle">Nudge participants, broadcast announcements, and monitor AI-optimized delivery performance.</p>
          </div>
          <button
            onClick={handleTriggerEngine}
            className="btn btn-secondary flex items-center gap-1.5"
            disabled={triggering}
            style={{ minWidth: 160 }}
          >
            {triggering ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Run Campaign Checks
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <Mail size={20} style={{ color: 'var(--brand-light)', marginBottom: 8 }} />
            <div className="stat-value" style={{ color: 'var(--brand-light)' }}>
              {statsLoading ? '...' : stats?.totalSent ?? 0}
            </div>
            <div className="stat-label">Total Sent Emails</div>
          </div>

          <div className="stat-card">
            <BarChart3 size={20} style={{ color: 'var(--success)', marginBottom: 8 }} />
            <div className="stat-value" style={{ color: 'var(--success)', display: 'flex', alignItems: 'baseline', gap: 4 }}>
              {statsLoading ? '...' : `${openRate}%`}
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>vs 15-20% avg</span>
            </div>
            <div className="stat-label">
              Open Rate
              {openRate >= targetEngagement ? (
                <span style={{ color: 'var(--success)', fontSize: 10, marginLeft: 6, fontWeight: 700 }}>★ Goal Achieved</span>
              ) : (
                <span style={{ color: 'var(--warning)', fontSize: 10, marginLeft: 6 }}>Target: 60%+</span>
              )}
            </div>
          </div>

          <div className="stat-card">
            <TrendingUp size={20} style={{ color: 'var(--brand)', marginBottom: 8 }} />
            <div className="stat-value" style={{ color: 'var(--brand)' }}>
              {statsLoading ? '...' : `${clickRate}%`}
            </div>
            <div className="stat-label">Click-through Rate</div>
          </div>

          <div className="stat-card" style={{ background: 'var(--bg-elevated)' }}>
            <Target size={20} style={{ color: 'var(--accent)', marginBottom: 8 }} />
            <div className="stat-value" style={{ color: 'var(--accent)', fontSize: 24, marginTop: 4 }}>
              AI Send Time
            </div>
            <div className="stat-label">Active (Predictive Scheduling)</div>
          </div>
        </div>

        {/* Campaign Metrics & Creator Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: 24, marginBottom: 24 }}>
          {/* Custom Composer */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Send size={16} style={{ color: 'var(--brand-light)' }} />
              <h3 style={{ fontWeight: 700, fontSize: 15 }}>Send Custom Campaign</h3>
            </div>
            <form onSubmit={handleSendCustom}>
              <div className="form-group">
                <label className="form-label">Target Audience</label>
                <select
                  className="form-select"
                  value={form.audience}
                  onChange={e => setForm(p => ({ ...p, audience: e.target.value }))}
                >
                  <option value="registered_no_team">Participants without Teams (Nudge)</option>
                  <option value="team_no_submission">Teams without Submissions (Nudge)</option>
                  <option value="all">All Participants ({stats?.participantsCount ?? 'loading...'} total)</option>
                  <option value="reviewer">Reviewers Only</option>
                  <option value="all_users">Everyone (Participants + Reviewers)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  placeholder="e.g. Final submissions are due tomorrow at midnight!"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message Body</label>
                <textarea
                  className="form-textarea"
                  value={form.body}
                  onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                  placeholder="Write your email content here. HTML tags and line breaks are supported."
                  rows={6}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                {submitting ? 'Dispatching Campaign...' : 'Send Campaign Now'}
              </button>
            </form>
          </div>

          {/* Campaign Analytics breakdown */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Target size={16} style={{ color: 'var(--brand)' }} />
              <h3 style={{ fontWeight: 700, fontSize: 15 }}>Campaign Performance</h3>
            </div>
            {statsLoading ? (
              <div style={{ margin: 'auto', padding: 40 }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, overflowY: 'auto' }}>
                {stats?.campaignStats?.map((c) => {
                  const rate = c.sent > 0 ? ((c.opened / c.sent) * 100).toFixed(0) : 0;
                  return (
                    <div key={c._id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                      <div className="flex-between" style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCampaignType(c._id)}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.sent} sent</span>
                      </div>
                      <div className="flex-between" style={{ marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Open Rate: {rate}%</span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Clicks: {c.clicked || 0}</span>
                      </div>
                      <div className="progress" style={{ height: 6 }}>
                        <div
                          className="progress-bar"
                          style={{
                            width: `${rate}%`,
                            background: rate >= targetEngagement ? 'var(--success)' : 'var(--brand)'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {!stats?.campaignStats?.length && (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No campaigns triggered yet.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Telemetry Logs */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} style={{ color: 'var(--brand-light)' }} />
              <h3 style={{ fontWeight: 700, fontSize: 15 }}>Real-Time Email Telemetry Logs</h3>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Search recipient..."
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
                className="form-input"
                style={{ width: 220, height: 36, padding: '0 12px', fontSize: 13 }}
              />
              <select
                value={filters.status}
                onChange={e => handleFilterChange('status', e.target.value)}
                className="form-select"
                style={{ width: 130, height: 36, fontSize: 13 }}
              >
                <option value="">All Statuses</option>
                <option value="sent">Sent</option>
                <option value="opened">Opened</option>
                <option value="clicked">Clicked</option>
                <option value="failed">Failed</option>
              </select>
              <select
                value={filters.campaignType}
                onChange={e => handleFilterChange('campaignType', e.target.value)}
                className="form-select"
                style={{ width: 180, height: 36, fontSize: 13 }}
              >
                <option value="">All Campaigns</option>
                <option value="welcome">Welcome Email</option>
                <option value="otp">OTP Verification</option>
                <option value="result">Hackathon Results</option>
                <option value="announcement">Custom Broadcast</option>
                <option value="journey_registered_no_team">No Team Nudge</option>
                <option value="journey_team_no_submission">No Submission Nudge</option>
                <option value="journey_submitted">Submission Confirmed</option>
                <option value="journey_evaluation_complete">AI Eval Complete</option>
              </select>
            </div>
          </div>

          {logsLoading ? (
            <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" style={{ margin: 'auto' }} /></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Recipient</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Subject</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Campaign Type</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Status</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Sent Time</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>AI Predicted Send Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logsData.logs.map((log) => (
                      <tr key={log._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{log.recipientEmail}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.subject}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12 }}>
                          <span className="badge badge-muted">{formatCampaignType(log.campaignType)}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12 }}>
                          <span className={`badge ${statusBadge[log.status] || 'badge-muted'}`}>{log.status}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                          {fmt.datetime(log.sentAt)}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                          {log.sendTimePrediction ? fmt.datetime(log.sendTimePrediction) : 'As Soon As Possible'}
                        </td>
                      </tr>
                    ))}
                    {!logsData.logs.length && (
                      <tr>
                        <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                          <Inbox size={24} style={{ margin: 'auto', marginBottom: 8, opacity: 0.5 }} />
                          No email telemetry logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {logsData.pages > 1 && (
                <div className="flex-between" style={{ marginTop: 16, padding: '0 4px' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Showing page {logsData.page} of {logsData.pages} (Total: {logsData.total} logs)
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px' }}
                      disabled={filters.page === 1}
                      onClick={() => handleFilterChange('page', filters.page - 1)}
                    >
                      <ChevronLeft size={14} /> Prev
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px' }}
                      disabled={filters.page === logsData.pages}
                      onClick={() => handleFilterChange('page', filters.page + 1)}
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
