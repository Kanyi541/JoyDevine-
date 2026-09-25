import React, { useState } from 'react';

interface LoadingImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const LoadingImage: React.FC<LoadingImageProps> = ({ src, alt, className = '' }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-700 rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`object-contain transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
      />
    </div>
  );
};
