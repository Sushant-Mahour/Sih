import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export function Modal({
  isOpen,
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-lg'
}) {
  const isVisible = Boolean(isOpen || open);
  const modalRef = useRef(null);
  const previouslyFocusedElement = useRef(null);

  useEffect(() => {
    if (isVisible) {
      previouslyFocusedElement.current = document.activeElement;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      // Focus first focusable element inside modal
      setTimeout(() => {
        if (modalRef.current) {
          const focusable = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          }
        }
      }, 50);

      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
        if (previouslyFocusedElement.current && previouslyFocusedElement.current.focus) {
          previouslyFocusedElement.current.focus();
        }
      };
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={`relative w-full ${maxWidth} bg-bg-elevated border border-border-subtle rounded-xl shadow-lg overflow-hidden transition-all`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border-subtle flex items-start justify-between gap-3 bg-bg-subtle/50">
          <div>
            <h3 id="modal-title" className="text-base font-semibold text-text-primary">
              {title}
            </h3>
            {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-subtle transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 max-h-[75vh] overflow-y-auto text-sm text-text-primary">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-3 border-t border-border-subtle bg-bg-subtle/40 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
