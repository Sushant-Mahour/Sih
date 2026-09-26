const mongoose = require('mongoose');
const { connectDB, closeDB } = require('./config/db');
const { stepSimulation } = require('./jobs/simulateVehicleMovement.job');

// Since stepSimulation is not exported, I'll copy the logic here to test it

const Vehicle = require('./models/Vehicle');
const RoadSegment = require('./models/RoadSegment');

function calculateBearing(lng1, lat1, lng2, lat2) {
  const toRad = deg => (deg * Math.PI) / 180;
  const toDeg = rad => (rad * 180) / Math.PI;

  const dLng = toRad(lng2 - lng1);
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);

  const y = Math.sin(dLng) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);

  let bearing = toDeg(Math.atan2(y, x));
  return Math.round((bearing + 360) % 360);
}

async function testSim() {
  await connectDB();
  try {
    const vehicles = await Vehicle.find({
      status: { $in: ['in_transit', 'caution_zone'] }
    });

    console.log(`Found ${vehicles.length} vehicles to simulate.`);

    if (!vehicles || vehicles.length === 0) return;

    for (const vehicle of vehicles) {
      let polyline = vehicle.activeRoutePolyline;

      if (!polyline || polyline.length < 2) {
        if (vehicle.assignedSegmentId) {
          const segment = await RoadSegment.findOne({ segmentId: vehicle.assignedSegmentId });
          if (segment?.geometry?.coordinates) {
            polyline = segment.geometry.coordinates;
            // vehicle.activeRoutePolyline = polyline; // Skip saving to DB just to see if extraction works
            vehicle.routeProgressIndex = 0;
            console.log(`Found polyline for ${vehicle.assignedSegmentId}, length: ${polyline.length}`);
          } else {
             console.log(`No segment or coordinates found for ${vehicle.assignedSegmentId}`);
          }
        }
      }

      if (!polyline || polyline.length < 2) {
        console.log(`Fallback polyline for ${vehicle.vehicleId}`);
        const currentCoord = vehicle.currentLocation?.coordinates || [91.7362, 26.1445];
        const nextCoord = [
          currentCoord[0] + (Math.random() - 0.5) * 0.002,
          currentCoord[1] + (Math.random() - 0.5) * 0.002
        ];
        polyline = [currentCoord, nextCoord];
      }

      let currentIndex = vehicle.routeProgressIndex || 0;
      let nextIndex = currentIndex + 1;

      if (nextIndex >= polyline.length) {
        polyline = polyline.slice().reverse();
        vehicle.activeRoutePolyline = polyline;
        currentIndex = 0;
        nextIndex = 1;
      }

      const p1 = polyline[currentIndex];
      const p2 = polyline[nextIndex];
      
      console.log(`p1:`, p1, `p2:`, p2);

      const fraction = 0.25;
      const currentLng = p1[0] + (p2[0] - p1[0]) * fraction;
      const currentLat = p1[1] + (p2[1] - p1[1]) * fraction;

      const heading = calculateBearing(p1[0], p1[1], p2[0], p2[1]);
      
      vehicle.routeProgressIndex = nextIndex;
      vehicle.currentLocation = {
        type: 'Point',
        coordinates: [Number(currentLng.toFixed(6)), Number(currentLat.toFixed(6))]
      };
      console.log(`New location for ${vehicle.vehicleId}:`, vehicle.currentLocation.coordinates);
      
      // Try validating the schema
      const err = vehicle.validateSync();
      if (err) {
         console.error(`Validation error for ${vehicle.vehicleId}:`, err.message);
      } else {
         try {
           await vehicle.save();
           console.log(`Vehicle ${vehicle.vehicleId} saved successfully.`);
         } catch (saveErr) {
           console.error(`Save error for ${vehicle.vehicleId}:`, saveErr.message);
         }
      }
    }
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await closeDB();
  }
}

testSim();
