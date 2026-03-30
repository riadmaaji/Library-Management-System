import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminGuard from './components/guards/AdminGuard';
import AuthGuard from './components/guards/AuthGuard';
import AppLayout from './components/layout/AppLayout';
import { Spinner } from './components/ui/Spinner';

const LoginPage = lazy(() => import('./pages/Login/LoginPage'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const BooksPage = lazy(() => import('./pages/Books/BooksPage'));
const CustomersPage = lazy(() => import('./pages/Customers/CustomersPage'));
const TransactionsPage = lazy(() => import('./pages/Transactions/TransactionsPage'));
const UsersPage = lazy(() => import('./pages/Users/UsersPage'));

function PageFallback() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '40vh' }}>
      <Spinner size="lg" aria-label="Loading page" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<AuthGuard />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/books" element={<BooksPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />

            <Route element={<AdminGuard />}>
              <Route path="/users" element={<UsersPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
