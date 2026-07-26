import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import Layout from '../components/layout/Layout';

// Page imports
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import SurveyManagement from '../pages/SurveyManagement';
import MonitoringSites from '../pages/MonitoringSites';
import CameraTrapManagement from '../pages/CameraTrapManagement';
import AudioSensorManagement from '../pages/AudioSensorManagement';
import ObservationHistory from '../pages/ObservationHistory';
import UserProfile from '../pages/UserProfile';
import UsersAndRoles from '../pages/UsersAndRoles';
import Unauthorized from '../pages/Unauthorized';
import NotFound from '../pages/NotFound';
import InteractiveGisMap from '../pages/InteractiveGisMap';

// Future AI & Management Placeholders
import WildlifeImageUpload from '../pages/ai/WildlifeImageUpload';
import WildlifeAudioUpload from '../pages/ai/WildlifeAudioUpload';
import PredictionHistory from '../pages/ai/PredictionHistory';
import PopulationEstimation from '../pages/ai/PopulationEstimation';
import BiodiversityAnalytics from '../pages/ai/BiodiversityAnalytics';
import HabitatIntelligence from '../pages/ai/HabitatIntelligence';
import ConservationRecommendations from '../pages/ai/ConservationRecommendations';
import WildlifeHealthScoring from '../pages/ai/WildlifeHealthScoring';
import IntelligenceDashboard from '../pages/ai/IntelligenceDashboard';
import ReportsCenter from '../pages/ReportsCenter';
import Settings from '../pages/Settings';
import NotificationCenter from '../pages/NotificationCenter';

const AppRoutes = () => {
  const allRoles = ['Administrator', 'Wildlife Researcher', 'Conservation Officer', 'Forest Department Officer'];

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Pages (encased in Layout) */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard/map"
        element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <InteractiveGisMap />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/surveys"
        element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <SurveyManagement />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sites"
        element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <MonitoringSites />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/camera-traps"
        element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <CameraTrapManagement />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/audio-sensors"
        element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <AudioSensorManagement />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/observations"
        element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <ObservationHistory />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <UserProfile />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Future AI Modules placeholders */}
      <Route
        path="/ai/image-upload"
        element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <WildlifeImageUpload />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai/audio-upload"
        element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <WildlifeAudioUpload />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai/prediction-history"
        element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <PredictionHistory />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai/population-est"
        element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <PopulationEstimation />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai/biodiversity"
        element={
          <ProtectedRoute allowedRoles={['Administrator', 'Wildlife Researcher']}>
            <Layout>
              <BiodiversityAnalytics />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai/habitat"
        element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <HabitatIntelligence />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai/recommendations"
        element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <ConservationRecommendations />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai/health-scoring"
        element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <WildlifeHealthScoring />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai/intelligence-dashboard"
        element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <IntelligenceDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Management placeholders */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <ReportsCenter />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute allowedRoles={allRoles}>
            <Layout>
              <NotificationCenter />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Administrator-only account directory */}
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <Layout>
              <UsersAndRoles />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Fallback 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
