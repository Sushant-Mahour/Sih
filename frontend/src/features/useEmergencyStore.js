import { create } from 'zustand';
import { emergencyService } from '../services/domainServices';

export const useEmergencyStore = create((set, get) => ({
  isEmergencyActive: false, // Priority 8 fix: default OFF on login
  emergencyTitle: 'REGIONAL DISASTER PROTOCOL (STANDBY)',
  operationalSummary: 'Standard monitoring protocol. Joint Command standing by for monsoon risk escalation.',
  sitRep: '',
  loadingSitRep: false,
  driverAcknowledgements: [
    { driverName: 'Bikash Borah', vehicleId: 'NER-CONVOY-101', acknowledged: true, time: '14:35 IST' },
    { driverName: 'P. Lyngdoh', vehicleId: 'NER-CONVOY-102', acknowledged: false, time: 'Pending' },
    { driverName: 'Tsering Dorjee', vehicleId: 'NER-CONVOY-103', acknowledged: true, time: '14:38 IST' },
    { driverName: 'Imti Jamir', vehicleId: 'NER-CONVOY-104', acknowledged: false, time: 'Pending' }
  ],

  setEmergencyActive: (active) => set({ isEmergencyActive: active }),

  toggleEmergency: async (active, title, summary) => {
    try {
      const data = await emergencyService.toggleEmergencyMode({ active, title, summary });
      if (data.emergencyState) {
        set({
          isEmergencyActive: data.emergencyState.isActive,
          emergencyTitle: data.emergencyState.title,
          operationalSummary: data.emergencyState.operationalSummary
        });
      }
    } catch (err) {
      set({ isEmergencyActive: active });
    }
  },

  fetchSitRep: async () => {
    set({ loadingSitRep: true });
    try {
      const data = await emergencyService.generateSitRep();
      set({ sitRep: data.sitRep, loadingSitRep: false });
    } catch (err) {
      set({ loadingSitRep: false });
    }
  }
}));
