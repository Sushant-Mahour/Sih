import { io } from 'socket.io-client';
import { useNotificationStore } from '../features/useNotificationStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected to NER Tactical Server:', socketInstance.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
    });
  }
  return socketInstance;
}

export function subscribeToLiveVehicles(queryClient) {
  const socket = getSocket();

  const handleLocationUpdate = (updatedVehicle) => {
    // Patch React Query cache directly for 'vehicles' key
    queryClient.setQueryData(['vehicles'], (oldData) => {
      if (!oldData || !oldData.data) return oldData;
      const updatedList = oldData.data.map((v) => {
        if (v.vehicleId === updatedVehicle.vehicleId) {
          return { ...v, ...updatedVehicle };
        }
        return v;
      });
      return { ...oldData, data: updatedList };
    });

    // Patch single vehicle query if active
    queryClient.setQueryData(['vehicle', updatedVehicle.vehicleId], (oldSingle) => {
      if (!oldSingle || !oldSingle.data) return oldSingle;
      return {
        ...oldSingle,
        data: { ...oldSingle.data, ...updatedVehicle }
      };
    });
  };

  const handleAlert = (newAlert) => {
    queryClient.invalidateQueries({ queryKey: ['alerts'] });
    if (newAlert) {
      useNotificationStore.getState().addNotification({
        type: 'alert_critical',
        title: newAlert.title || 'CRITICAL ADVISORY',
        message: newAlert.message || 'Severe weather or hazard update',
        severity: newAlert.severity === 'critical' ? 5 : 4,
        targetPath: '/alerts'
      });
    }
  };

  const handleIncident = (incident) => {
    queryClient.invalidateQueries({ queryKey: ['incidents'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    if (incident && (incident.title || incident.description)) {
      useNotificationStore.getState().addNotification({
        type: 'incident_pending',
        title: `Field Incident: ${incident.title || 'Hazard Reported'}`,
        message: incident.description || `Reported in ${incident.districtName || 'NER Sector'}`,
        hasVoiceNote: Boolean(incident.audioDataUrl || incident.hasAudio),
        audioDataUrl: incident.audioDataUrl || null,
        audioDuration: incident.audioDurationSec ? `0:${incident.audioDurationSec < 10 ? '0' : ''}${incident.audioDurationSec}` : '0:20',
        incidentId: incident.clientUuid || incident._id,
        targetPath: `/incidents/${incident.clientUuid || incident._id || ''}`,
        severity: incident.severity || 3
      });
    }
  };

  const handleNotification = (notif) => {
    if (notif) {
      useNotificationStore.getState().addNotification(notif);
    }
  };

  const handleRoadBlock = (blockage) => {
    queryClient.invalidateQueries({ queryKey: ['road-blocks'] });
    queryClient.invalidateQueries({ queryKey: ['roads'] });
    queryClient.invalidateQueries({ queryKey: ['routes'] });
    if (blockage) {
      useNotificationStore.getState().addNotification({
        type: 'road_block',
        title: `ROAD BLOCK: ${blockage.name || blockage.corridorName || 'Highway Segment'}`,
        message: `Corridor declared impassable due to ${blockage.reason || 'landslide'}. Rerouting enabled.`,
        targetPath: '/emergency',
        severity: 5
      });
    }
  };

  const handleDispatch = () => {
    queryClient.invalidateQueries({ queryKey: ['dispatches'] });
    queryClient.invalidateQueries({ queryKey: ['convoys'] });
  };

  socket.on('vehicle:location_update', handleLocationUpdate);
  socket.on('alert:broadcast', handleAlert);
  socket.on('incident:new', handleIncident);
  socket.on('incident:created', handleIncident);
  socket.on('incident:verified', handleIncident);
  socket.on('notification:new', handleNotification);
  socket.on('road:blocked', handleRoadBlock);
  socket.on('dispatch:scheduled', handleDispatch);

  return () => {
    socket.off('vehicle:location_update', handleLocationUpdate);
    socket.off('alert:broadcast', handleAlert);
    socket.off('incident:new', handleIncident);
    socket.off('incident:created', handleIncident);
    socket.off('incident:verified', handleIncident);
    socket.off('notification:new', handleNotification);
    socket.off('road:blocked', handleRoadBlock);
    socket.off('dispatch:scheduled', handleDispatch);
  };
}
