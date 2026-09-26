import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useEmergencyStore } from '../../features/useEmergencyStore';

export function EmergencyBanner() {
  const { isEmergencyActive, emergencyTitle } = useEmergencyStore();
  const navigate = useNavigate();

  if (!isEmergencyActive) return null;

  return (
    <div className="bg-danger-bg border-b border-danger/30 px-4 py-2 flex items-center justify-between text-text-primary z-30 sticky top-0 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-danger">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-2 h-2 rounded-full bg-danger live-dot flex-shrink-0" />
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-danger whitespace-nowrap">
            Emergency protocol active:
          </span>
          <span className="text-xs text-text-primary truncate">
            {emergencyTitle}
          </span>
        </div>
      </div>

      <button
        onClick={() => navigate('/emergency')}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-danger hover:bg-red-700 text-white rounded-[6px] text-xs font-medium transition cursor-pointer flex-shrink-0 ml-3"
      >
        Crisis Console <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default EmergencyBanner;
