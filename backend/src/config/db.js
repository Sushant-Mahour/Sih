const mongoose = require('mongoose');
const config = require('./env');

async function connectDB() {
  mongoose.set('strictQuery', false);
  
  // Use the connection string from .env or default to local mongodb
  const uri = config.mongoUri || 'mongodb://127.0.0.1:27017/ner_logistics';

  try {
    console.log(`[Database] Attempting connection to local MongoDB at: ${uri}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
    });
    console.log(`[Database] Connected to local MongoDB successfully at: ${uri}`);
  } catch (err) {
    console.error(`[Database] Critical: Could not connect to local MongoDB at ${uri}. Please ensure MongoDB is installed and running on your PC.`);
    console.error(`Error details: ${err.message}`);
    process.exit(1); // Exit process with failure
  }

  mongoose.connection.on('error', (err) => {
    console.error('[Database] MongoDB runtime error:', err);
  });
}

async function closeDB() {
  await mongoose.disconnect();
  console.log('[Database] Disconnected from MongoDB');
}

module.exports = { connectDB, closeDB };
