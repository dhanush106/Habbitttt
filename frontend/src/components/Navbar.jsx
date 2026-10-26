import { motion } from 'framer-motion';
import { Activity, ArrowRight, Check, CheckCircle2, CodeXml, ListTodo, LogOut } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

function Navbar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = ['/login', '/register', '/signin'].includes(location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <motion.header className="topbar" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Link className="brand-lockup" to={user ? '/tracker' : '/login'} aria-label="Habbittt home">
        <span className="brand-mark"><Check size={17} strokeWidth={3} /></span><span>Habbittt</span>
      </Link>
      <nav className="topbar-nav" aria-label="Main navigation">
        {user ? <>
          <NavLink aria-label="Habit tracker" title="Habit tracker" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/tracker"><CheckCircle2 size={14} /><span>Habits</span></NavLink>
          <NavLink aria-label="Fitness tracker" title="Fitness tracker" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/fitness"><Activity size={14} /><span>Fitness</span></NavLink>
          <NavLink aria-label="LeetTrack" title="LeetTrack" className={({ isActive }) => `nav-link nav-leettrack${isActive ? ' active' : ''}`} to="/leettrack"><CodeXml size={15} /><span>LeetTrack</span></NavLink>
          <NavLink aria-label="ToDo planner" title="ToDo planner" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/todo"><ListTodo size={15} /><span>ToDo</span></NavLink>
          <span className="nav-user">{user.name}</span>
          <button className="nav-logout" type="button" onClick={handleLogout} title="Sign out" aria-label="Sign out"><LogOut size={16} /></button>
        </> : <Link className="nav-quiet-link" to={location.pathname === '/register' ? '/login' : '/register'}>
          {isAuthPage && location.pathname === '/register' ? 'Sign in' : 'Create account'} <ArrowRight size={15} />
        </Link>}
      </nav>
    </motion.header>
  );
}

export default Navbar;
