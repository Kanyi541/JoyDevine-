import React from 'react';
import { motion } from 'motion/react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0A192F]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          repeat: Infinity,
          repeatType: "reverse",
          duration: 1.5,
          ease: "easeInOut"
        }}
      >
        <img 
          src="/joydevine-logo.png" 
          alt="JoyDevine Loading" 
          className="w-24 h-24 object-contain"
        />
      </motion.div>
      <motion.div
        className="mt-6 text-white text-sm font-mono tracking-widest"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        LOADING...
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
