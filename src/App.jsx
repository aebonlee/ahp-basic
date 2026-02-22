import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { EvaluationProvider } from './contexts/EvaluationContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AdminDashboard from './pages/AdminDashboard';
import ModelBuilderPage from './pages/ModelBuilderPage';
import BrainstormingPage from './pages/BrainstormingPage';
import ModelConfirmPage from './pages/ModelConfirmPage';
import EvaluatorManagementPage from './pages/EvaluatorManagementPage';
import AdminResultPage from './pages/AdminResultPage';
import SensitivityPage from './pages/SensitivityPage';
import ResourceAllocationPage from './pages/ResourceAllocationPage';
import WorkshopPage from './pages/WorkshopPage';
import EvaluatorMainPage from './pages/EvaluatorMainPage';
import PairwiseRatingPage from './pages/PairwiseRatingPage';
import DirectInputPage from './pages/DirectInputPage';
import EvalResultPage from './pages/EvalResultPage';
import InviteLandingPage from './pages/InviteLandingPage';

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <ProjectProvider>
          <EvaluationProvider>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/register" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/eval/invite/:token" element={<InviteLandingPage />} />

              {/* Admin */}
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/project/:id" element={<ProtectedRoute><ModelBuilderPage /></ProtectedRoute>} />
              <Route path="/admin/project/:id/brain" element={<ProtectedRoute><BrainstormingPage /></ProtectedRoute>} />
              <Route path="/admin/project/:id/confirm" element={<ProtectedRoute><ModelConfirmPage /></ProtectedRoute>} />
              <Route path="/admin/project/:id/eval" element={<ProtectedRoute><EvaluatorManagementPage /></ProtectedRoute>} />
              <Route path="/admin/project/:id/result" element={<ProtectedRoute><AdminResultPage /></ProtectedRoute>} />
              <Route path="/admin/project/:id/sensitivity" element={<ProtectedRoute><SensitivityPage /></ProtectedRoute>} />
              <Route path="/admin/project/:id/resource" element={<ProtectedRoute><ResourceAllocationPage /></ProtectedRoute>} />
              <Route path="/admin/project/:id/workshop" element={<ProtectedRoute><WorkshopPage /></ProtectedRoute>} />

              {/* Evaluator */}
              <Route path="/eval" element={<ProtectedRoute><EvaluatorMainPage /></ProtectedRoute>} />
              <Route path="/eval/project/:id" element={<ProtectedRoute><PairwiseRatingPage /></ProtectedRoute>} />
              <Route path="/eval/project/:id/direct" element={<ProtectedRoute><DirectInputPage /></ProtectedRoute>} />
              <Route path="/eval/project/:id/result" element={<ProtectedRoute><EvalResultPage /></ProtectedRoute>} />

              {/* Default */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </EvaluationProvider>
        </ProjectProvider>
      </AuthProvider>
    </HashRouter>
  );
}
