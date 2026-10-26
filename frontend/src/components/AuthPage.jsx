import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', password: '', age: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  if (token) return <Navigate to="/tracker" replace />;

  const update = (event) => {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
    if (error) setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      if (isRegister) {
        await register({
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password,
          ...(values.age ? { age: Number(values.age) } : {}),
        });
      } else {
        await login({ email: values.email.trim(), password: values.password });
      }
      navigate('/tracker', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="auth-page">
      <motion.section className="auth-panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}>
        <div className="auth-art" aria-hidden="true">
          <div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" />
          <div className="auth-art-top"><span className="brand-mark large"><LockKeyhole size={18} /></span><span>Small actions. Real momentum.</span></div>
          <div className="auth-preview">
            <div className="preview-heading"><span>THIS WEEK</span><span className="preview-dot" /></div>
            <div className="preview-title">Build a rhythm<br />that feels like yours.</div>
            <div className="preview-days" aria-hidden="true">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <span className={index < 4 ? 'preview-day done' : 'preview-day'} key={`${day}-${index}`}>{index < 4 ? '✓' : day}</span>)}
            </div>
            <div className="preview-progress"><span /></div><div className="preview-caption">4 of 7 days in motion</div>
          </div>
          <p className="auth-art-foot">Progress is a practice, not a finish line.</p>
        </div>

        <div className="auth-form-wrap">
          <div className="auth-form-heading">
            <p className="eyebrow">{isRegister ? 'YOUR NEXT CHAPTER' : 'WELCOME BACK'}</p>
            <h1>{isRegister ? 'Make room for better habits.' : 'Pick up where you left off.'}</h1>
            <p className="auth-subtitle">{isRegister ? 'Create your account and shape a week that works for you.' : 'Sign in to see the progress you have been building.'}</p>
          </div>
          <form className="auth-form" onSubmit={submit}>
            <AnimatePresence initial={false}>
              {error && <motion.div className="form-error" role="alert" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{error}</motion.div>}
            </AnimatePresence>
            {isRegister && <label className="field-label">Name<span className="field-wrap"><UserRound size={17} /><input autoComplete="name" name="name" onChange={update} placeholder="Your name" required value={values.name} /></span></label>}
            <label className="field-label">Email<span className="field-wrap"><Mail size={17} /><input autoComplete="email" name="email" onChange={update} placeholder="you@example.com" required type="email" value={values.email} /></span></label>
            <label className="field-label">Password<span className="field-wrap"><LockKeyhole size={17} /><input autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={8} name="password" onChange={update} placeholder="At least 8 characters" required type={showPassword ? 'text' : 'password'} value={values.password} /><button className="password-toggle" onClick={() => setShowPassword((shown) => !shown)} type="button" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
            {isRegister && <label className="field-label">Age <span className="field-optional">Optional</span><span className="field-wrap"><input max="120" min="13" name="age" onChange={update} placeholder="13 or older" type="number" value={values.age} /></span></label>}
            <button className="auth-submit" disabled={pending} type="submit">{pending ? <span className="button-spinner" /> : <>{isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={17} /></>}</button>
          </form>
          <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to Habbittt?'}{' '}<Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
          <p className="auth-legal">By continuing, you agree to keep showing up for yourself.</p>
        </div>
      </motion.section>
    </main>
  );
}

export default AuthPage;