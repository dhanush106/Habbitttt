import { motion } from 'framer-motion';
import { useLayoutEffect, useState } from 'react';
import { Activity, ArrowRight, Check, CheckCircle2, CodeXml, ListTodo, LogOut, Moon, Sun } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

function Navbar() {
  const [theme, setTheme] = useState(() => window.localStorage.getItem('habbittt-theme') === 'light' ? 'light' : 'dark');
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = ['/login', '/register', '/signin'].includes(location.pathname);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('habbittt-theme', theme);
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <motion.header className="topbar" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}>
      <Link className="brand-lockup" to={user ? '/tracker' : '/login'} aria-label="Habbittt home">
        <span className="brand-mark"><Check size={17} strokeWidth={3} /></span><span>Habbittt</span>
      </Link>
      <nav className="topbar-nav" aria-label="Main navigation">
        {user ? <>
          <NavLink aria-label="Habit tracker" title="Habit tracker" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/tracker"><CheckCircle2 size={14} /><span>Habits</span></NavLink>
          <NavLink aria-label="Fitness tracker" title="Fitness tracker" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/fitness"><Activity size={14} /><span>Fitness</span></NavLink>
          <NavLink aria-label="LeetTrack" title="LeetTrack" className={({ isActive }) => `nav-link nav-leettrack${isActive ? ' active' : ''}`} to="/leettrack"><CodeXml size={15} /><span>LeetTrack</span></NavLink>
          <NavLink aria-label="Daily Todo" title="Daily Todo" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/todo"><ListTodo size={15} /><span>ToDo</span></NavLink>
          <span className="nav-user">{user.name}</span>
          <button className="theme-toggle" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'light'}>
            <motion.span key={theme} initial={{ opacity: 0, rotate: -35, scale: 0.7 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} transition={{ duration: 0.2 }}><span className="sr-only">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</motion.span>
          </button>
          <button className="nav-logout" type="button" onClick={handleLogout} title="Sign out" aria-label="Sign out"><LogOut size={16} /></button>
        </> : <>
          <Link className="nav-quiet-link" to={location.pathname === '/register' ? '/login' : '/register'}>
            {isAuthPage && location.pathname === '/register' ? 'Sign in' : 'Create account'} <ArrowRight size={15} />
          </Link>
          <button className="theme-toggle" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'light'}>
            <motion.span key={theme} initial={{ opacity: 0, rotate: -35, scale: 0.7 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} transition={{ duration: 0.2 }}>{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</motion.span>
          </button>
        </>}
      </nav>
    </motion.header>
  );
}

export default Navbar;
