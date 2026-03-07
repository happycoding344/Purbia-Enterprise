import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            {/* Future Routes like /invoices, /customers go here */}
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
