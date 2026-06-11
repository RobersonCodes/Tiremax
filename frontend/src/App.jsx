import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { PrivateRoute } from './components/PrivateRoute'
import AppLayout from './layouts/AppLayout'

import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ClientsPage from './pages/clients/ClientsPage'
import ClientDetailPage from './pages/clients/ClientDetailPage'
import InventoryPage from './pages/inventory/InventoryPage'
import ProductDetailPage from './pages/inventory/ProductDetailPage'
import SalesPage from './pages/sales/SalesPage'
import POSPage from './pages/sales/POSPage'
import SaleDetailPage from './pages/sales/SaleDetailPage'
import ServicesPage from './pages/services/ServicesPage'
import ServiceDetailPage from './pages/services/ServiceDetailPage'
import NewServicePage from './pages/services/NewServicePage'
import FinancialPage from './pages/financial/FinancialPage'
import ReportsPage from './pages/reports/ReportsPage'
import SettingsPage from './pages/settings/SettingsPage'
import SuperAdminPage from './pages/admin/SuperAdminPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="admin" element={<SuperAdminPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="clients/:id" element={<ClientDetailPage />} />
              <Route path="inventory" element={<InventoryPage />} />
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
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
