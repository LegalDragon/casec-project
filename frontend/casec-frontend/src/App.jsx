import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useStore';
import ThemeProvider from './components/ThemeProvider';
import Layout from './components/Layout';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Clubs from './pages/Clubs';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import EnhancedProfile from './pages/EnhancedProfile';
import Payment from './pages/Payment';
import Members from './pages/Members';
import BoardOfDirectors from './pages/BoardOfDirectors';
import PublicProfile from './pages/PublicProfile';
import AdminUsers from './pages/admin/Users';
import AdminMembershipTypes from './pages/admin/MembershipTypes';
import AdminClubs from './pages/admin/Clubs';
import AdminEvents from './pages/admin/Events';
import AdminEventDetail from './pages/admin/EventDetail';
import AdminEventTypes from './pages/admin/EventTypes';
import AdminTheme from './pages/admin/ThemeCustomization';
import AdminPayments from './pages/admin/Payments';
import AdminPaymentMethods from './pages/admin/PaymentMethods';
import AdminPolls from './pages/admin/Polls';
import AdminSurveys from './pages/admin/Surveys';
import Membership from './pages/Membership';

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/" />;
}

function PublicOnlyRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" /> : children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
  }));

  return isAuthenticated && user?.isAdmin ? children : <Navigate to="/dashboard" />;
}

// Route that allows both system admins and club admins
// The AdminClubs page will filter to show only clubs the user can manage
function ClubAdminRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/" />;
}

function App() {
  return (
    <ThemeProvider>
      <PWAInstallPrompt />
      <Router>
        <Routes>
        {/* Public Home Page */}
        <Route path="/" element={
          <PublicOnlyRoute>
            <Home />
          </PublicOnlyRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/event/:eventId" element={<EventDetail />} />

        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clubs" element={<Clubs />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:eventId" element={<EventDetail />} />
          <Route path="profile" element={<EnhancedProfile />} />
          <Route path="membership" element={<Membership />} />
          <Route path="payment" element={<Payment />} />
          <Route path="members" element={<Members />} />
          <Route path="member/:userId" element={<PublicProfile />} />
          <Route path="board-of-directors" element={<BoardOfDirectors />} />
          <Route path="board-profile/:userId" element={<PublicProfile />} />

          {/* Admin Routes */}
          <Route path="admin/users" element={
            <AdminRoute><AdminUsers /></AdminRoute>
          } />
          <Route path="admin/membership-types" element={
            <AdminRoute><AdminMembershipTypes /></AdminRoute>
          } />
          <Route path="admin/clubs" element={
            <ClubAdminRoute><AdminClubs /></ClubAdminRoute>
          } />
          <Route path="admin/events" element={
            <ClubAdminRoute><AdminEvents /></ClubAdminRoute>
          } />
          <Route path="admin/events/:eventId" element={
            <ClubAdminRoute><AdminEventDetail /></ClubAdminRoute>
          } />
          <Route path="admin/event-types" element={
            <AdminRoute><AdminEventTypes /></AdminRoute>
          } />
          <Route path="admin/theme" element={
            <AdminRoute><AdminTheme /></AdminRoute>
          } />
          <Route path="admin/payments" element={
            <AdminRoute><AdminPayments /></AdminRoute>
          } />
          <Route path="admin/payment-methods" element={
            <AdminRoute><AdminPaymentMethods /></AdminRoute>
          } />
          <Route path="admin/polls" element={
            <AdminRoute><AdminPolls /></AdminRoute>
          } />
          <Route path="admin/surveys" element={
            <AdminRoute><AdminSurveys /></AdminRoute>
          } />
        </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
