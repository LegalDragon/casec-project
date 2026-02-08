import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useStore';
import ThemeProvider from './components/ThemeProvider';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import ChatWidget from './components/ChatWidget';
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
import AdminDashboard from './pages/admin/Dashboard';
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
import AdminSlideShows from './pages/admin/SlideShows';
import SlideShowPreview from './pages/SlideShowPreview';
import AdminRaffles from './pages/admin/Raffles';
import AdminEventPrograms from './pages/admin/EventPrograms';
import AdminContentCards from './pages/admin/ContentCards';
import AdminPerformers from './pages/admin/Performers';
import AdminRoles from './pages/admin/Roles';
import AdminAssetManager from './pages/admin/AssetManager';
import AdminAssetFileTypes from './pages/admin/AssetFileTypes';
import AdminSeatingCharts from './pages/admin/SeatingCharts';
import AdminSeatingChartDetail from './pages/admin/SeatingChartDetail';
import AdminSeatRaffles from './pages/admin/SeatRaffles';
import SeatRaffleDrawing from './pages/SeatRaffleDrawing';
import LiveTranscriptionCapture from './pages/LiveTranscriptionCapture';
import LiveTranscriptionDisplay from './pages/LiveTranscriptionDisplay';
import Membership from './pages/Membership';
import Raffle from './pages/Raffle';
import RaffleDrawing from './pages/RaffleDrawing';
import EventProgram from './pages/EventProgram';
import LivePoll from './pages/LivePoll';
import PollVoter from './pages/PollVoter';
import ProgramRating from './pages/ProgramRating';
import ProgramPoster from './pages/ProgramPoster';
import DeploymentHistory from './pages/DeploymentHistory';

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/" />;
}

function PublicOnlyRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" /> : children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, hasAdminAccess } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    hasAdminAccess: state.hasAdminAccess,
  }));

  // Allow access if user is system admin OR has any admin roles
  return isAuthenticated && hasAdminAccess() ? children : <Navigate to="/dashboard" />;
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
      <ChatWidget />
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
        <Route path="/preview/slideshow/:code" element={<SlideShowPreview />} />
        <Route path="/raffle/:raffleId" element={<Raffle />} />
        <Route path="/raffle/:raffleId/drawing" element={<RaffleDrawing />} />
        <Route path="/seat-raffle/:raffleId" element={<SeatRaffleDrawing />} />
        <Route path="/live-transcription/capture" element={<LiveTranscriptionCapture />} />
        <Route path="/live-transcription" element={<LiveTranscriptionDisplay />} />
        <Route path="/program/:slug" element={<EventProgram />} />
        <Route path="/program/:slug/poster" element={<ProgramPoster />} />
        <Route path="/live-poll/:pollId" element={<LivePoll />} />
        <Route path="/vote/:pollId" element={<PollVoter />} />
        <Route path="/rate/:eventSlug" element={<ProgramRating />} />
        <Route path="/deployments" element={<DeploymentHistory />} />

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
        </Route>

        {/* Admin Routes with AdminLayout */}
        <Route path="/admin" element={
          <AdminRoute><AdminLayout /></AdminRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="membership-types" element={<AdminMembershipTypes />} />
          <Route path="clubs" element={<AdminClubs />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="events/:eventId" element={<AdminEventDetail />} />
          <Route path="event-types" element={<AdminEventTypes />} />
          <Route path="theme" element={<AdminTheme />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="payment-methods" element={<AdminPaymentMethods />} />
          <Route path="polls" element={<AdminPolls />} />
          <Route path="surveys" element={<AdminSurveys />} />
          <Route path="slideshows" element={<AdminSlideShows />} />
          <Route path="raffles" element={<AdminRaffles />} />
          <Route path="programs" element={<AdminEventPrograms />} />
          <Route path="performers" element={<AdminPerformers />} />
          <Route path="content-cards" element={<AdminContentCards />} />
          <Route path="roles" element={<AdminRoles />} />
          <Route path="assets" element={<AdminAssetManager />} />
          <Route path="asset-file-types" element={<AdminAssetFileTypes />} />
          <Route path="seating-charts" element={<AdminSeatingCharts />} />
          <Route path="seating-charts/:chartId" element={<AdminSeatingChartDetail />} />
          <Route path="seat-raffles" element={<AdminSeatRaffles />} />
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
