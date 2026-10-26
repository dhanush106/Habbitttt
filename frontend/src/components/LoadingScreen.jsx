import { motion } from 'framer-motion';

function LoadingScreen({ label = 'Loading' }) {
  return <div className="loading-screen" role="status" aria-live="polite"><motion.span className="loading-mark" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }} /><span>{label}</span></div>;
}

export default LoadingScreen;