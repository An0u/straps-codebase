import React, { useEffect } from 'react';

interface CelebrationBannerProps {
  message: string;
  onDismiss: () => void;
}

// Deliberately a small, purpose-built component rather than a toast library
// — sonner and shadcn's own toast system were removed as unused dead weight
// during the mobile performance pass; this is the one real use case for a
// transient notification, so it gets a lightweight one-off instead of
// reintroducing either.
const CelebrationBanner: React.FC<CelebrationBannerProps> = ({ message, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div
        className="px-5 py-3 rounded-full text-[14px] font-medium text-white whitespace-nowrap"
        style={{
          background: 'linear-gradient(135deg, #9952e0, #7a3fc0)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          animation: 'celebrationSlideIn 0.4s ease-out forwards',
        }}
      >
        {message}
      </div>
      <style>{`
        @keyframes celebrationSlideIn {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default CelebrationBanner;
