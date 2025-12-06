import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useStore';
import ThemeProvider from './components/ThemeProvider';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Clubs from './pages/Clubs';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Profile from './pages/Profile';
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
import AdminTheme from './pages/admin/ThemeCustomization';

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
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
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clubs" element={<Clubs />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:eventId" element={<EventDetail />} />
          <Route path="profile" element={<EnhancedProfile />} />
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
          <Route path="admin/theme" element={
            <AdminRoute><AdminTheme /></AdminRoute>
          } />
        </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
