import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { EvaluationProvider } from './contexts/EvaluationContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminGuard from './components/common/AdminGuard';
import ToastContainer from './components/common/Toast';

// Pages
import HomePage from './pages/HomePage';
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
import SurveyBuilderPage from './pages/SurveyBuilderPage';
import SurveyResultPage from './pages/SurveyResultPage';
import EvaluatorMainPage from './pages/EvaluatorMainPage';
import PairwiseRatingPage from './pages/PairwiseRatingPage';
import DirectInputPage from './pages/DirectInputPage';
import EvalResultPage from './pages/EvalResultPage';
import EvalPreSurveyPage from './pages/EvalPreSurveyPage';
import InviteLandingPage from './pages/InviteLandingPage';

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <ProjectProvider>
          <EvaluationProvider>
            <ToastProvider>
            <ToastContainer />
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/register" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/eval/invite/:token" element={<InviteLandingPage />} />

              {/* Admin */}
              <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
              <Route path="/admin/project/:id" element={<AdminGuard><ModelBuilderPage /></AdminGuard>} />
              <Route path="/admin/project/:id/brain" element={<AdminGuard><BrainstormingPage /></AdminGuard>} />
              <Route path="/admin/project/:id/confirm" element={<AdminGuard><ModelConfirmPage /></AdminGuard>} />
              <Route path="/admin/project/:id/survey" element={<AdminGuard><SurveyBuilderPage /></AdminGuard>} />
              <Route path="/admin/project/:id/eval" element={<AdminGuard><EvaluatorManagementPage /></AdminGuard>} />
              <Route path="/admin/project/:id/result" element={<AdminGuard><AdminResultPage /></AdminGuard>} />
              <Route path="/admin/project/:id/survey-result" element={<AdminGuard><SurveyResultPage /></AdminGuard>} />
              <Route path="/admin/project/:id/sensitivity" element={<AdminGuard><SensitivityPage /></AdminGuard>} />
              <Route path="/admin/project/:id/resource" element={<AdminGuard><ResourceAllocationPage /></AdminGuard>} />
              <Route path="/admin/project/:id/workshop" element={<AdminGuard><WorkshopPage /></AdminGuard>} />

              {/* Evaluator */}
              <Route path="/eval" element={<ProtectedRoute><EvaluatorMainPage /></ProtectedRoute>} />
              <Route path="/eval/project/:id" element={<ProtectedRoute><PairwiseRatingPage /></ProtectedRoute>} />
              <Route path="/eval/project/:id/direct" element={<ProtectedRoute><DirectInputPage /></ProtectedRoute>} />
              <Route path="/eval/project/:id/pre-survey" element={<ProtectedRoute><EvalPreSurveyPage /></ProtectedRoute>} />
              <Route path="/eval/project/:id/result" element={<ProtectedRoute><EvalResultPage /></ProtectedRoute>} />

              {/* Default */}
              <Route path="/" element={<HomePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </ToastProvider>
          </EvaluationProvider>
        </ProjectProvider>
      </AuthProvider>
    </HashRouter>
  );
}
