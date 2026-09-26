const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');

const config = require('./config/env');
const { connectDB } = require('./config/db');
const routes = require('./routes');
const { initializeSocket } = require('./sockets/liveTracking.socket');
const { startVehicleSimulation } = require('./jobs/simulateVehicleMovement.job');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const seedDatabase = require('./seed/seed');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});
initializeSocket(io);

// Security & Parsing Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false
}));

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Mount API v1
app.use('/api/v1', routes);

// Root greeting
app.get('/', (req, res) => {
  res.json({
    platform: 'NER Logistics & Emergency Command System (NIDAN)',
    version: '1.0.0',
    status: 'OPERATIONAL',
    apiDocs: '/api/v1/health',
    timestamp: new Date()
  });
});

// 404 and Centralized Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Server startup
async function startServer() {
  try {
    await connectDB();

    // Auto-seed if users table is empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Server Startup] Empty database detected. Running initial seed...');
      await seedDatabase();
    }

    // Start Live Vehicle Simulation Job
    startVehicleSimulation(2500);

    server.listen(config.port, () => {
      console.log(`========================================================`);
      console.log(`🚀 NER Tactical Logistics Server active on port ${config.port}`);
      console.log(`📡 Socket.io live tracking server ready`);
      console.log(`🌐 Base URL: http://localhost:${config.port}`);
      console.log(`========================================================`);
    });
  } catch (err) {
    console.error('[Server Startup] Fatal failure:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, server };
