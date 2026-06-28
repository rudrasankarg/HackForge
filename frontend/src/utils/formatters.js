export const fmt = {
  date: (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
  datetime: (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—',
  score: (n) => typeof n === 'number' ? n.toFixed(1) : '—',
  pct: (n) => typeof n === 'number' ? `${(n * 100).toFixed(0)}%` : '—',
  truncate: (s, len = 120) => s && s.length > len ? s.slice(0, len) + '...' : s || '',
  initials: (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?',
  plural: (n, word) => `${n} ${word}${n !== 1 ? 's' : ''}`,
};

export const STATUS_MAP = {
  submitted: 'badge-primary',
  evaluated: 'badge-success',
  disqualified: 'badge-danger',
  draft: 'badge-muted',
  pending: 'badge-warning',
  completed: 'badge-success',
  active: 'badge-success',
  upcoming: 'badge-info',
  closed: 'badge-muted',
};

export const DOMAINS = [
  'Web Development', 'Mobile Development', 'Machine Learning', 'Data Science',
  'DevOps', 'Backend', 'Security', 'Blockchain', 'UI/UX Design', 'IoT', 'AR/VR', 'Other',
];

export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
