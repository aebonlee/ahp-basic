import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { EvaluationProvider } from './contexts/EvaluationContext';
import { ToastProvider } from './contexts/ToastContext';
import { CartProvider } from './contexts/CartContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import AdminGuard from './components/common/AdminGuard';
import SuperAdminGuard from './components/common/SuperAdminGuard';
import EvaluatorGuard from './components/common/EvaluatorGuard';
import ToastContainer from './components/common/Toast';
import LoadingSpinner from './components/common/LoadingSpinner';

// Eager-loaded pages (initial landing)
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

// Lazy-loaded pages
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const InviteLandingPage = lazy(() => import('./pages/InviteLandingPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ModelBuilderPage = lazy(() => import('./pages/ModelBuilderPage'));
const BrainstormingPage = lazy(() => import('./pages/BrainstormingPage'));
const ModelConfirmPage = lazy(() => import('./pages/ModelConfirmPage'));
const EvaluatorManagementPage = lazy(() => import('./pages/EvaluatorManagementPage'));
const AdminResultPage = lazy(() => import('./pages/AdminResultPage'));
const SensitivityPage = lazy(() => import('./pages/SensitivityPage'));
const ResourceAllocationPage = lazy(() => import('./pages/ResourceAllocationPage'));
const WorkshopPage = lazy(() => import('./pages/WorkshopPage'));
const SurveyBuilderPage = lazy(() => import('./pages/SurveyBuilderPage'));
const SurveyResultPage = lazy(() => import('./pages/SurveyResultPage'));
const EvaluatorMainPage = lazy(() => import('./pages/EvaluatorMainPage'));
const PairwiseRatingPage = lazy(() => import('./pages/PairwiseRatingPage'));
const DirectInputPage = lazy(() => import('./pages/DirectInputPage'));
const EvalResultPage = lazy(() => import('./pages/EvalResultPage'));
const EvalPreSurveyPage = lazy(() => import('./pages/EvalPreSurveyPage'));
const SuperAdminPage = lazy(() => import('./pages/SuperAdminPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'));
const GuidePage = lazy(() => import('./pages/GuidePage'));
const ManualPage = lazy(() => import('./pages/ManualPage'));
const LearnPage = lazy(() => import('./pages/LearnPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const StatisticalAnalysisPage = lazy(() => import('./pages/StatisticalAnalysisPage'));
const AiAnalysisPage = lazy(() => import('./pages/AiAnalysisPage'));
const SurveyStatsPage = lazy(() => import('./pages/SurveyStatsPage'));
const ManagementPage = lazy(() => import('./pages/ManagementPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const OrderHistoryPage = lazy(() => import('./pages/OrderHistoryPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <HashRouter>
      <ErrorBoundary>
      <AuthProvider>
        <ProjectProvider>
          <EvaluationProvider>
            <ToastProvider>
            <CartProvider>
            <ToastContainer />
            <Suspense fallback={<LoadingSpinner message="페이지 로딩 중..." />}>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/register" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/eval/invite/:token" element={<InviteLandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/guide" element={<GuidePage />} />
              <Route path="/manual" element={<ManualPage />} />
              <Route path="/learn" element={<LearnPage />} />
              <Route path="/survey-stats" element={<SurveyStatsPage />} />
              <Route path="/management" element={<ManagementPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
              <Route path="/order-history" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />

              {/* Super Admin */}
              <Route path="/superadmin" element={<SuperAdminGuard><SuperAdminPage /></SuperAdminGuard>} />

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
              <Route path="/admin/project/:id/statistics" element={<AdminGuard><StatisticalAnalysisPage /></AdminGuard>} />
              <Route path="/admin/project/:id/ai-analysis" element={<AdminGuard><AiAnalysisPage /></AdminGuard>} />

              {/* Evaluator */}
              <Route path="/eval" element={<ProtectedRoute><EvaluatorMainPage /></ProtectedRoute>} />
              <Route path="/eval/project/:id" element={<EvaluatorGuard><PairwiseRatingPage /></EvaluatorGuard>} />
              <Route path="/eval/project/:id/direct" element={<EvaluatorGuard><DirectInputPage /></EvaluatorGuard>} />
              <Route path="/eval/project/:id/pre-survey" element={<EvaluatorGuard><EvalPreSurveyPage /></EvaluatorGuard>} />
              <Route path="/eval/project/:id/result" element={<EvaluatorGuard><EvalResultPage /></EvaluatorGuard>} />

              {/* Default */}
              <Route path="/" element={<HomePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            </Suspense>
            </CartProvider>
            </ToastProvider>
          </EvaluationProvider>
        </ProjectProvider>
      </AuthProvider>
      </ErrorBoundary>
    </HashRouter>
  );
}
