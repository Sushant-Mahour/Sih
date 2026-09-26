let ioInstance = null;

function initializeSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Tactical client connected: ${socket.id}`);

    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`[Socket.io] Client ${socket.id} joined room: ${room}`);
    });

    socket.on('leave_room', (room) => {
      socket.leave(room);
    });

    // Driver acknowledgement event
    socket.on('driver:acknowledge', (data) => {
      console.log(`[Socket.io] Driver acknowledged instruction:`, data);
      if (ioInstance) {
        ioInstance.emit('driver:ack_received', {
          ...data,
          receivedAt: new Date()
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
}

function getIO() {
  return ioInstance;
}

function broadcastVehicleUpdate(vehicleData) {
  if (ioInstance) {
    ioInstance.emit('vehicle:location_update', vehicleData);
    ioInstance.to(`vehicle:${vehicleData.vehicleId}`).emit('vehicle:telemetry_tick', vehicleData);
  }
}

function broadcastAlert(alertData) {
  if (ioInstance) {
    ioInstance.emit('alert:broadcast', alertData);
    ioInstance.emit('alert:created', alertData);
    ioInstance.emit('notification:new', {
      type: 'alert_critical',
      title: alertData.title,
      message: alertData.message,
      severity: alertData.severity === 'critical' ? 5 : 4,
      targetPath: '/alerts',
      timestamp: new Date()
    });
  }
}

function broadcastIncidentCreated(incidentData) {
  if (ioInstance) {
    ioInstance.emit('incident:created', incidentData);
    ioInstance.emit('incident:new', incidentData);
    ioInstance.emit('notification:new', {
      type: 'incident_pending',
      title: `Field Incident: ${incidentData.title || 'Hazard Reported'}`,
      message: incidentData.description || `Reported in ${incidentData.districtName}`,
      hasVoiceNote: Boolean(incidentData.photoBase64 || incidentData.audioDataUrl),
      targetPath: `/incidents/${incidentData.clientUuid || incidentData._id}`,
      incidentId: incidentData.clientUuid || incidentData._id,
      severity: incidentData.severity || 3,
      timestamp: new Date()
    });
  }
}

function broadcastIncidentStatus(incidentData, affectedDrivers = []) {
  if (ioInstance) {
    ioInstance.emit('incident:verified', incidentData);
    ioInstance.emit('incident:status_update', incidentData);

    // Notify reporting driver and affected drivers
    ioInstance.emit('driver:notification', {
      type: incidentData.status === 'verified' ? 'incident_verified' : 'incident_status',
      title: incidentData.status === 'verified' ? 'HAZARD CONFIRMED BY COMMANDANT' : `Incident Update: ${incidentData.status.toUpperCase()}`,
      message: incidentData.status === 'verified'
        ? `Commandant verified hazard on ${incidentData.districtName}. Alternate routing enabled.`
        : (incidentData.rejectionReason || incidentData.clarificationQuery || `Status changed to ${incidentData.status}`),
      incidentId: incidentData.clientUuid || incidentData._id,
      rejectionReason: incidentData.rejectionReason,
      timestamp: new Date()
    });
  }
}

function broadcastRoadBlock(roadData) {
  if (ioInstance) {
    ioInstance.emit('road:blocked', roadData);
    ioInstance.emit('road:status_update', roadData);
    ioInstance.emit('notification:new', {
      type: 'road_block',
      title: `ROAD BLOCK: ${roadData.name || roadData.segmentId}`,
      message: roadData.isBlocked
        ? `Impassable blockage declared. Reason: ${roadData.blockageReason || 'Severe hazard'}. Rerouting active.`
        : `Corridor ${roadData.name} has been CLEARED and reopened to traffic.`,
      targetPath: '/emergency',
      severity: roadData.isBlocked ? 5 : 2,
      timestamp: new Date()
    });
  }
}

function broadcastDispatchScheduled(dispatchData) {
  if (ioInstance) {
    ioInstance.emit('dispatch:scheduled', dispatchData);
  }
}

module.exports = {
  initializeSocket,
  getIO,
  broadcastVehicleUpdate,
  broadcastAlert,
  broadcastIncidentCreated,
  broadcastIncidentStatus,
  broadcastRoadBlock,
  broadcastDispatchScheduled
};
