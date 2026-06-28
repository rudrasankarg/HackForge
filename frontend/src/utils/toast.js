let _root = null;

const getRoot = () => {
  if (!_root) {
    _root = document.createElement('div');
    _root.id = 'toast-root';
    _root.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
    document.body.appendChild(_root);
  }
  return _root;
};

const COLORS = {
  success: { bg: 'var(--success-dim)', border: 'rgba(16,185,129,0.3)', color: 'var(--success)' },
  error:   { bg: 'var(--danger-dim)',  border: 'rgba(239,68,68,0.3)',  color: 'var(--danger)' },
  warning: { bg: 'var(--warning-dim)', border: 'rgba(245,158,11,0.3)', color: 'var(--warning)' },
  info:    { bg: 'var(--info-dim)',    border: 'rgba(59,130,246,0.3)', color: 'var(--info)' },
};

const LABELS = { success: 'Success', error: 'Error', warning: 'Warning', info: 'Info' };

function show(message, type = 'info', duration = 4000) {
  const c = COLORS[type];
  const el = document.createElement('div');
  el.style.cssText = `
    pointer-events:all;min-width:260px;max-width:380px;padding:12px 16px;
    border-radius:8px;background:${c.bg};border:1px solid ${c.border};
    color:var(--text-primary);font-family:Inter,sans-serif;font-size:13.5px;
    display:flex;gap:10px;align-items:flex-start;box-shadow:0 4px 20px rgba(0,0,0,0.4);
    animation:slideIn 0.2s ease;
  `;

  const label = document.createElement('span');
  label.style.cssText = `font-weight:700;color:${c.color};white-space:nowrap;font-size:12px;margin-top:1px;`;
  label.textContent = LABELS[type];

  const text = document.createElement('span');
  text.style.color = 'var(--text-secondary)';
  text.textContent = message;

  el.append(label, text);
  getRoot().appendChild(el);

  const timer = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.2s';
    setTimeout(() => el.remove(), 200);
  }, duration);

  el.addEventListener('click', () => { clearTimeout(timer); el.remove(); });
}

if (!document.getElementById('toast-anim')) {
  const s = document.createElement('style');
  s.id = 'toast-anim';
  s.textContent = '@keyframes slideIn{from{transform:translateX(20px);opacity:0}to{transform:translateX(0);opacity:1}}';
  document.head.appendChild(s);
}

export const toast = {
  success: (m, d) => show(m, 'success', d),
  error:   (m, d) => show(m, 'error',   d),
  warning: (m, d) => show(m, 'warning', d),
  info:    (m, d) => show(m, 'info',    d),
};
