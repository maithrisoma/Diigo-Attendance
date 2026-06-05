import React from 'react';

/**
 * AuroraBackground — Premium animated aurora effect.
 *
 * variant="page"   → full fixed background (Login page)
 * variant="header" → relative contained strip (Dashboard headers)
 * variant="hero"   → relative contained taller strip (Reports/hero sections)
 */
interface AuroraBackgroundProps {
  variant?: 'page' | 'header' | 'hero';
  children?: React.ReactNode;
  className?: string;
}

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  variant = 'page',
  children,
  className = '',
}) => {
  const isPage = variant === 'page';
  const isHeader = variant === 'header';

  const wrapperClass = isPage
    ? `fixed inset-0 z-0 overflow-hidden pointer-events-none`
    : `absolute inset-0 overflow-hidden pointer-events-none rounded-2xl`;

  return (
    <div className={`relative ${isPage ? '' : 'overflow-hidden'} ${className}`}>
      {/* Aurora canvas */}
      <div className={wrapperClass} aria-hidden="true">

        {/* Base gradient — shifts slowly */}
        <div className="aurora-base" />

        {/* Aurora beams — 5 fluid blobs */}
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
        <div className="aurora-blob aurora-blob-4" />
        <div className="aurora-blob aurora-blob-5" />

        {/* Mesh overlay for depth */}
        <div className="aurora-mesh" />

        {/* Noise/grain texture for premium feel */}
        <div className="aurora-grain" />
      </div>

      {/* Content layer */}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
};
