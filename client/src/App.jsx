import { Navigate, Route, Routes } from 'react-router-dom';
import AdminGuard from './components/guards/AdminGuard';
import AuthGuard from './components/guards/AuthGuard';
import AppLayout from './components/layout/AppLayout';
import BooksPage from './pages/Books/BooksPage';
import CustomersPage from './pages/Customers/CustomersPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import LoginPage from './pages/Login/LoginPage';
import TransactionsPage from './pages/Transactions/TransactionsPage';
import UsersPage from './pages/Users/UsersPage';

export default function App() {
  return (
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
  );
}
