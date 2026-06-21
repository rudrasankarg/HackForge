import React, { useState } from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Trophy,
  CalendarDays, UsersRound, ClipboardList, UserCheck, Megaphone,
  BrainCircuit, ShieldAlert, Fingerprint,
  Scale, FileText, Settings,
  LogOut, Plus, ChevronDown, ChevronRight, Home,
  Users, FolderOpen
} from 'lucide-react';

const NAV_GROUPS = [
  {
    key: 'main',
    title: 'MAIN',
    defaultOpen: true,
    items: [
      { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
      { label: 'Chat',      to: '/admin/chat',      icon: UsersRound },
      { label: 'Results',      to: '/admin/results',      icon: Trophy },
    ],
  },
  {
    key: 'management',
    title: 'MANAGEMENT',
    defaultOpen: false,
    items: [
      { label: 'Hackathons',    to: '/admin/hackathons',    icon: CalendarDays },
      { label: 'Organizers',    to: '/admin/organizers',    icon: UserCheck },
      { label: 'Teams',         to: '/admin/teams',         icon: UsersRound },
      { label: 'Registrations', to: '/admin/registrations', icon: ClipboardList },
      { label: 'Assignments',   to: '/admin/assignments',   icon: UserCheck },
      { label: 'Announcements', to: '/admin/announcements', icon: Megaphone },
      { label: 'Help Desk',     to: '/admin/tickets',       icon: ClipboardList },
    ],
  },
  {
    key: 'ai',
    title: 'AI INTELLIGENCE',
    defaultOpen: false,
    items: [
      { label: 'AI Evaluation',  to: '/admin/ai-project-evaluation', icon: BrainCircuit },
      { label: 'Fairness Court', to: '/admin/fairness-court',          icon: Scale },
      { label: 'Bias Monitor',   to: '/admin/bias-explained',        icon: ShieldAlert },
      { label: 'Cheat Shield',   to: '/admin/cheat-shield',          icon: ShieldAlert },
      { label: 'Similarity',     to: '/admin/analytics',             icon: Fingerprint },
    ],
  },

  {
    key: 'system',
    title: 'SYSTEM',
    defaultOpen: false,
    items: [
      { label: 'Appeals',    to: '/admin/appeals',     icon: Scale },
      { label: 'Audit Logs', to: '/admin/audit-trail', icon: FileText },
    ],
  },
];

export default function Sidebar({ biasAlertCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initOpen = {};
  NAV_GROUPS.forEach(g => { initOpen[g.key] = g.defaultOpen; });
  const [open, setOpen] = useState(initOpen);

  const toggle = (key) => setOpen(prev => ({ ...prev, [key]: !prev[key] }));
  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const prefix = user?.role === 'admin' ? '/admin' : user?.role === 'organizer' ? '/organizer' : user?.role === 'reviewer' ? '/reviewers' : '/participant';

  // Participant / reviewer — minimal sidebar
  if (user?.role !== 'admin' && user?.role !== 'organizer') {
    const navItems = (() => {
      if (user?.role === 'reviewer') {
        return [
          { label: 'My Assignments', to: '/reviewers', icon: ClipboardList, end: true },
          { label: 'AI Evaluation', to: '/reviewers/ai-project-evaluation', icon: BrainCircuit },
          { label: 'Announcements', to: '/participant/announcements', icon: Megaphone },
          { label: 'Chat', to: '/participant/chat', icon: UsersRound },
          { label: 'Help Desk', to: '/reviewers/tickets', icon: ClipboardList },
        ];
      }

      return [
        { label: 'Dashboard', to: '/participant', icon: Home, end: true },
        { label: 'Hackathons', to: '/participant/hackathons', icon: CalendarDays },
        { label: 'My Team', to: '/participant/team', icon: UsersRound },
        { label: 'Submit Project', to: '/participant/submit', icon: FolderOpen },
        { label: 'Announcements', to: '/participant/announcements', icon: Megaphone },
        { label: 'Chat', to: '/participant/chat', icon: UsersRound },
        { label: 'Feedback', to: '/participant/feedback', icon: FileText },
        { label: 'Appeal', to: '/participant/appeal', icon: Scale },
        { label: 'Help Desk', to: '/participant/help-desk', icon: Scale },
        { label: 'Profile', to: '/participant/profile', icon: Users },
      ];
    })();

    const profilePath = user?.role === 'reviewer' ? '/reviewers' : '/participant/profile';

    return (
      <aside
        className="fixed left-0 top-0 h-screen flex flex-col z-50"
        style={{ width: 248, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}
      >
        <Link to={prefix} className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', textDecoration: 'none' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: 'var(--text-primary)', color: 'var(--bg-surface)' }}>HF</div>
          <span className="font-extrabold tracking-tight" style={{ fontSize: 17, color: 'var(--text-primary)' }}>HackForge</span>
        </Link>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'text-orange-700 bg-orange-50'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`
              }
            >
              <item.icon size={15} /> <span style={{ color: 'var(--text-primary)' }}>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer mb-2" onClick={() => navigate(profilePath)}>
            <div
              className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold flex-shrink-0"
              style={{ fontSize: 12, background: 'var(--brand)' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate" style={{ fontSize: 13, color: 'var(--text-primary)' }}>{user?.name || 'Participant'}</p>
              <p className="capitalize" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.role}</p>
            </div>
            <Settings size={14} className="text-stone-400" />
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-[13px] font-medium text-stone-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>
    );
  }

  // Filter Nav Groups for Admin / Organizer
  const filteredNavGroups = NAV_GROUPS.map(group => {
    const items = group.items.filter(item => {
      // Hide Organizers tab from organizers
      if (user?.role === 'organizer' && item.label === 'Organizers') {
        return false;
      }
      return true;
    }).map(item => {
      // Dynamically replace '/admin' prefix with user's role prefix
      const to = item.to.replace('/admin', prefix);
      return { ...item, to };
    });
    return { ...group, items };
  });

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-50 overflow-hidden"
      style={{ width: 252, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}
    >
      {/* Brand */}
      <Link to={prefix} className="px-5 py-5 flex items-center gap-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', textDecoration: 'none' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: 'var(--text-primary)', color: 'var(--bg-surface)' }}>HF</div>
        <span className="font-extrabold tracking-tight" style={{ fontSize: 17, color: 'var(--text-primary)' }}>HackForge</span>
      </Link>

      {/* Accordion Nav */}
      <nav className="flex-1 overflow-y-auto px-4 py-4">
        {filteredNavGroups.map(group => {
          const isGroupActive = group.items.some(item =>
            item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to)
          );

          return (
            <div key={group.key} className="mb-3">
              {/* Accordion Header — plain text, NO border/bg */}
              <button
                onClick={() => toggle(group.key)}
                className="w-full flex items-center justify-between pb-2"
                style={{
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                  padding: '0 4px 8px 4px',
                }}
              >
                <span
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: isGroupActive ? 'var(--brand)' : 'var(--text-muted)' }}
                >
                  {group.title}
                </span>
                {open[group.key]
                  ? <ChevronDown size={12} strokeWidth={2.5} style={{ color: 'var(--text-muted)' }} />
                  : <ChevronRight size={12} strokeWidth={2.5} style={{ color: 'var(--text-muted)' }} />
                }
              </button>

              {/* Accordion Items */}
              <div
                className="overflow-hidden transition-all duration-250 ease-in-out"
                style={{ maxHeight: open[group.key] ? `${group.items.length * 42}px` : '0px' }}
              >
                <div className="space-y-0.5 mb-1">
                  {group.items.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                          isActive
                            ? 'text-orange-700 bg-orange-50'
                            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                        }`
                      }
                      style={({ isActive }) => isActive
                        ? { borderLeft: '2.5px solid var(--brand)', paddingLeft: '10px' }
                        : {}
                      }
                    >
                      <item.icon size={14} />
                      <span style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                      {item.to.includes('bias-explained') && biasAlertCount > 0 && (
                        <span
                          className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: 'var(--brand)', color: '#fff' }}
                        >
                          {biasAlertCount}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <Link
          to={`${prefix}/hackathons`}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white font-bold transition-colors mb-3"
          style={{ fontSize: 13, background: 'var(--brand)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--brand-light)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--brand)'}
        >
          <Plus size={14} /> Create Hackathon
        </Link>

        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer" style={{ background: 'transparent' }} onClick={() => navigate(`${prefix}/profile`)}>
          <div
            className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold flex-shrink-0"
            style={{ fontSize: 12, background: 'var(--brand)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate" style={{ fontSize: 13, color: 'var(--text-primary)' }}>{user?.name || 'Admin'}</p>
            <p className="capitalize" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.role}</p>
          </div>
          <Settings size={14} className="text-stone-400" />
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full mt-2 px-3 py-2 rounded-xl text-[13px] font-medium text-stone-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          style={{ background: 'transparent', border: '1px solid var(--border)' }}
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </aside>
  );
}
