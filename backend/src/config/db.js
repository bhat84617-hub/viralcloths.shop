const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    isConnected = false;
    console.warn(`MongoDB unavailable (${err.message}) — running in API-only mode without database`);
  }
  return isConnected;
};

const getDBStatus = () => isConnected;

module.exports = { connectDB, getDBStatus };
