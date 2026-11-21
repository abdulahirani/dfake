import React, { useEffect, useRef, useState } from 'react';
import { Shield } from 'lucide-react';
import { buildWebpSrcSet, optimizeImageUrl } from '../lib/image';

interface OptimizedImageProps {
  src?: string | null;
  alt: string;
  width?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  containerClassName?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 640,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
  className = '',
  containerClassName = '',
}) => {
  const optimizedSrc = optimizeImageUrl(src, width);
  const srcSet = buildWebpSrcSet(src);
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }
  }, [optimizedSrc]);

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-slate-900/70 ${containerClassName}`}
    >
      {/* Fast lightweight shimmer while remote image streams */}
      {!loaded && !hasError && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] animate-pulse"
        />
      )}

      {hasError ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0B1120] to-[#030712] text-[#00F3FF]/50 p-4 text-center">
          <Shield size={28} className="mb-1.5" />
          <span className="text-[10px] font-mono uppercase tracking-widest opacity-70">
            Forensic Report
          </span>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={optimizedSrc}
          srcSet={srcSet}
          sizes={srcSet ? sizes : undefined}
          alt={alt}
          width={width}
          height={Math.round((width * 9) / 16)}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'low'}
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setHasError(true);
            setLoaded(true);
          }}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
        />
      )}
    </div>
  );
};
