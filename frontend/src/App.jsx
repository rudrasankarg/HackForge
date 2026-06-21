import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Landing from './pages/Landing';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import OrganizerLogin from './pages/OrganizerLogin';
import Register from './pages/Register';
import RegisterOrganizer from './pages/RegisterOrganizer';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Status from './pages/Status';

import AdminDashboard from './pages/admin/Dashboard';
import AdminParticipants from './pages/admin/Participants';
import AdminTeams from './pages/admin/Teams';
import AdminProjects from './pages/admin/Projects';
import AdminAssignment from './pages/admin/ReviewerAssignment';
import AdminEvaluation from './pages/admin/Evaluation';
import AdminResults from './pages/admin/Results';
import AdminAnnouncements from './pages/admin/Announcements';
import AdminAppeals from './pages/admin/Appeals';
import AdminAnalytics from './pages/admin/Analytics';
import AdminRegistrations from './pages/admin/Registrations';
import AdminHackathons from './pages/admin/Hackathons';
import AdminBiasExplained from './pages/admin/BiasExplained';
import AdminAuditTrail from './pages/admin/AuditTrail';
import AdminOrganizers from './pages/admin/Organizers';
import AiProjectEvaluation from './pages/admin/AiProjectEvaluation';
import FairnessCourt from './pages/admin/FairnessCourt';
import CheatShield from './pages/admin/CheatShield';


import ReviewerDashboard from './pages/reviewer/Dashboard';
import ReviewerEvaluate from './pages/reviewer/Evaluate';

import ParticipantDashboard from './pages/participant/Dashboard';
import ParticipantTeam from './pages/participant/Team';
import ParticipantSubmit from './pages/participant/SubmitProject';
import ParticipantAnnouncements from './pages/participant/Announcements';
import ParticipantChat from './pages/participant/Chat';
import ParticipantFeedback from './pages/participant/Feedback';
import ParticipantAppeal from './pages/participant/Appeal';
import ParticipantHackathons from './pages/participant/Hackathons';
import ParticipantHelpDesk from './pages/participant/HelpDesk';
import ParticipantProfile from './pages/participant/Profile';
import ChatbotWidget from './components/ChatbotWidget';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'organizer') return <Navigate to="/organizer" replace />;
  if (user.role === 'reviewer') return <Navigate to="/reviewers" replace />;
  return <Navigate to="/participant" replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/organizer/login" element={<OrganizerLogin />} />
        <Route path="/reviewer/login" element={<OrganizerLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register-organizer" element={<RegisterOrganizer />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/status" element={<Status />} />
        <Route path="/dashboard" element={<RoleRedirect />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/registrations" element={<ProtectedRoute roles={['admin']}><AdminRegistrations /></ProtectedRoute>} />
        <Route path="/admin/hackathons" element={<ProtectedRoute roles={['admin']}><AdminHackathons /></ProtectedRoute>} />
        <Route path="/admin/participants" element={<ProtectedRoute roles={['admin']}><AdminParticipants /></ProtectedRoute>} />
        <Route path="/admin/teams" element={<ProtectedRoute roles={['admin']}><AdminTeams /></ProtectedRoute>} />
        <Route path="/admin/projects" element={<ProtectedRoute roles={['admin']}><AdminProjects /></ProtectedRoute>} />
        <Route path="/admin/assignments" element={<ProtectedRoute roles={['admin']}><AdminAssignment /></ProtectedRoute>} />
        <Route path="/admin/evaluation" element={<ProtectedRoute roles={['admin']}><AdminEvaluation /></ProtectedRoute>} />
        <Route path="/admin/ai-project-evaluation" element={<ProtectedRoute roles={['admin']}><AiProjectEvaluation /></ProtectedRoute>} />
        <Route path="/admin/fairness-court" element={<ProtectedRoute roles={['admin']}><FairnessCourt /></ProtectedRoute>} />
        <Route path="/admin/cheat-shield" element={<ProtectedRoute roles={['admin']}><CheatShield /></ProtectedRoute>} />
        <Route path="/admin/results" element={<ProtectedRoute roles={['admin']}><AdminResults /></ProtectedRoute>} />

        <Route path="/admin/announcements" element={<ProtectedRoute roles={['admin']}><AdminAnnouncements /></ProtectedRoute>} />
        <Route path="/admin/appeals" element={<ProtectedRoute roles={['admin']}><AdminAppeals /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><AdminAnalytics /></ProtectedRoute>} />
        <Route path="/admin/bias-explained" element={<ProtectedRoute roles={['admin']}><AdminBiasExplained /></ProtectedRoute>} />
        <Route path="/admin/audit-trail" element={<ProtectedRoute roles={['admin']}><AdminAuditTrail /></ProtectedRoute>} />
        <Route path="/admin/organizers" element={<ProtectedRoute roles={['admin']}><AdminOrganizers /></ProtectedRoute>} />
        <Route path="/admin/profile" element={<ProtectedRoute roles={['admin']}><ParticipantProfile /></ProtectedRoute>} />
        <Route path="/admin/tickets" element={<ProtectedRoute roles={['admin']}><ParticipantHelpDesk /></ProtectedRoute>} />
        <Route path="/admin/chat" element={<ProtectedRoute roles={['admin']}><ParticipantChat /></ProtectedRoute>} />

        {/* Organizer Routes */}
        <Route path="/organizer" element={<ProtectedRoute roles={['organizer']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/organizer/registrations" element={<ProtectedRoute roles={['organizer']}><AdminRegistrations /></ProtectedRoute>} />
        <Route path="/organizer/hackathons" element={<ProtectedRoute roles={['organizer']}><AdminHackathons /></ProtectedRoute>} />
        <Route path="/organizer/participants" element={<ProtectedRoute roles={['organizer']}><AdminParticipants /></ProtectedRoute>} />
        <Route path="/organizer/teams" element={<ProtectedRoute roles={['organizer']}><AdminTeams /></ProtectedRoute>} />
        <Route path="/organizer/projects" element={<ProtectedRoute roles={['organizer']}><AdminProjects /></ProtectedRoute>} />
        <Route path="/organizer/assignments" element={<ProtectedRoute roles={['organizer']}><AdminAssignment /></ProtectedRoute>} />
        <Route path="/organizer/evaluation" element={<ProtectedRoute roles={['organizer']}><AdminEvaluation /></ProtectedRoute>} />
        <Route path="/organizer/ai-project-evaluation" element={<ProtectedRoute roles={['organizer']}><AiProjectEvaluation /></ProtectedRoute>} />
        <Route path="/organizer/fairness-court" element={<ProtectedRoute roles={['organizer']}><FairnessCourt /></ProtectedRoute>} />
        <Route path="/organizer/cheat-shield" element={<ProtectedRoute roles={['organizer']}><CheatShield /></ProtectedRoute>} />
        <Route path="/organizer/results" element={<ProtectedRoute roles={['organizer']}><AdminResults /></ProtectedRoute>} />

        <Route path="/organizer/announcements" element={<ProtectedRoute roles={['organizer']}><AdminAnnouncements /></ProtectedRoute>} />
        <Route path="/organizer/appeals" element={<ProtectedRoute roles={['organizer']}><AdminAppeals /></ProtectedRoute>} />
        <Route path="/organizer/analytics" element={<ProtectedRoute roles={['organizer']}><AdminAnalytics /></ProtectedRoute>} />
        <Route path="/organizer/bias-explained" element={<ProtectedRoute roles={['organizer']}><AdminBiasExplained /></ProtectedRoute>} />
        <Route path="/organizer/audit-trail" element={<ProtectedRoute roles={['organizer']}><AdminAuditTrail /></ProtectedRoute>} />
        <Route path="/organizer/profile" element={<ProtectedRoute roles={['organizer']}><ParticipantProfile /></ProtectedRoute>} />
        <Route path="/organizer/tickets" element={<ProtectedRoute roles={['organizer']}><ParticipantHelpDesk /></ProtectedRoute>} />
        <Route path="/organizer/chat" element={<ProtectedRoute roles={['organizer']}><ParticipantChat /></ProtectedRoute>} />

        {/* Reviewer Routes */}
        <Route path="/reviewers" element={<ProtectedRoute roles={['reviewer']}><ReviewerDashboard /></ProtectedRoute>} />
        <Route path="/reviewers/ai-project-evaluation" element={<ProtectedRoute roles={['reviewer']}><AiProjectEvaluation /></ProtectedRoute>} />
        <Route path="/reviewers/evaluate/:projectId" element={<ProtectedRoute roles={['reviewer']}><ReviewerEvaluate /></ProtectedRoute>} />

        <Route path="/reviewers/tickets" element={<ProtectedRoute roles={['reviewer']}><ParticipantHelpDesk /></ProtectedRoute>} />
        <Route path="/reviewers/announcements" element={<ProtectedRoute roles={['reviewer']}><ParticipantAnnouncements /></ProtectedRoute>} />
        <Route path="/reviewers/chat" element={<ProtectedRoute roles={['reviewer']}><ParticipantChat /></ProtectedRoute>} />

        <Route path="/participant" element={<ProtectedRoute roles={['participant']}><ParticipantDashboard /></ProtectedRoute>} />
        <Route path="/participant/team" element={<ProtectedRoute roles={['participant']}><ParticipantTeam /></ProtectedRoute>} />
        <Route path="/participant/submit" element={<ProtectedRoute roles={['participant']}><ParticipantSubmit /></ProtectedRoute>} />
        <Route path="/participant/announcements" element={<ProtectedRoute roles={['participant', 'reviewer', 'admin']}><ParticipantAnnouncements /></ProtectedRoute>} />
        <Route path="/participant/chat" element={<ProtectedRoute roles={['participant', 'reviewer', 'admin']}><ParticipantChat /></ProtectedRoute>} />
        <Route path="/participant/feedback" element={<ProtectedRoute roles={['participant']}><ParticipantFeedback /></ProtectedRoute>} />
        <Route path="/participant/appeal" element={<ProtectedRoute roles={['participant']}><ParticipantAppeal /></ProtectedRoute>} />
        <Route path="/participant/hackathons" element={<ProtectedRoute roles={['participant']}><ParticipantHackathons /></ProtectedRoute>} />
        <Route path="/participant/help-desk" element={<ProtectedRoute roles={['participant']}><ParticipantHelpDesk /></ProtectedRoute>} />
        <Route path="/participant/profile" element={<ProtectedRoute roles={['participant']}><ParticipantProfile /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      {user && <ChatbotWidget />}
    </>
  );
}

export default function App() {
  useEffect(() => {
    const theme = localStorage.getItem('hf_theme');
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, []);

  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
