import React from 'react';
import { motion } from 'motion/react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'LOADING GENUINE AUTO SPARES...' }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0A192F] px-4 select-none">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          repeat: Infinity,
          repeatType: "reverse",
          duration: 1.2,
          ease: "easeInOut"
        }}
      >
        <img 
          src="/joydevine-logo.png" 
          alt="JoyDivine Auto Spares" 
          className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-full shadow-2xl border-2 border-blue-400/30 bg-white/5 p-1"
        />
      </motion.div>
      <motion.div
        className="mt-6 text-white text-xs sm:text-sm font-mono tracking-wider font-bold text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {message}
      </motion.div>
      <div className="mt-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
        <span className="text-[11px] text-slate-400 font-mono">
          Room B13, Kirinyaga Crescent • Nairobi
        </span>
      </div>
    </div>
  );
};

export default LoadingScreen;
