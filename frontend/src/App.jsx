import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { PrivateRoute } from './components/PrivateRoute'
import AppLayout from './layouts/AppLayout'

import LandingPage from './pages/marketing/LandingPage'
import PrivacyPage from './pages/legal/PrivacyPage'
import TermsPage from './pages/legal/TermsPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ClientsPage from './pages/clients/ClientsPage'
import ClientDetailPage from './pages/clients/ClientDetailPage'
import InventoryPage from './pages/inventory/InventoryPage'
import ProductDetailPage from './pages/inventory/ProductDetailPage'
import StockMovementsPage from './pages/inventory/StockMovementsPage'
import SalesPage from './pages/sales/SalesPage'
import POSPage from './pages/sales/POSPage'
import SaleDetailPage from './pages/sales/SaleDetailPage'
import ServicesPage from './pages/services/ServicesPage'
import ServiceDetailPage from './pages/services/ServiceDetailPage'
import NewServicePage from './pages/services/NewServicePage'
import FinancialPage from './pages/financial/FinancialPage'
import ReportsPage from './pages/reports/ReportsPage'
import SettingsPage from './pages/settings/SettingsPage'
import TeamPage from './pages/settings/TeamPage'
import SuperAdminPage from './pages/admin/SuperAdminPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <Routes>
            {/* Public marketing site — this is what Google Ads / cold traffic should land on */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/privacidade" element={<PrivacyPage />} />
            <Route path="/termos" element={<TermsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
            <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

            {/* Authenticated app — same URLs as before (no /app prefix), just no
                longer nested under "/" so the landing page can own that path. */}
            <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="admin" element={<SuperAdminPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="clients/:id" element={<ClientDetailPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="inventory/movements" element={<StockMovementsPage />} />
              <Route path="inventory/:id" element={<ProductDetailPage />} />
              <Route path="sales" element={<SalesPage />} />
              <Route path="sales/new" element={<POSPage />} />
              <Route path="sales/:id" element={<SaleDetailPage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="services/new" element={<NewServicePage />} />
              <Route path="services/:id" element={<ServiceDetailPage />} />
              <Route path="financial" element={<FinancialPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="settings/team" element={<TeamPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
