import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoadingScreen from './components/LoadingScreen';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './stores/authStore';

const Tracker = lazy(() => import('./pages/Tracker'));
const Fitness = lazy(() => import('./pages/Fitness'));
const LeetTrack = lazy(() => import('./pages/LeetTrack'));
const Todo = lazy(() => import('./pages/Todo'));
const Login = lazy(() => import('./pages/Login'));
const Signin = lazy(() => import('./pages/Signin'));

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="app-shell">
      <Navbar />
      <Suspense fallback={<LoadingScreen label="Opening your workspace" />}>
        <Routes>
          <Route path="/" element={<Navigate to="/tracker" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Signin />} />
          <Route path="/signin" element={<Navigate to="/register" replace />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/tracker" element={<Tracker />} />
            <Route path="/fitness" element={<Fitness />} />
            <Route path="/leettrack" element={<LeetTrack />} />
            <Route path="/todo" element={<Todo />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
