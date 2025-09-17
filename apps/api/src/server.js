'use strict';

// @ts-nocheck
require('dotenv').config({ path: '../../.env' });
const app = require('./app');
const { connectToDatabase } = require('./config/db');

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/seedplanner';

(async () => {
  try {
    await connectToDatabase(MONGODB_URI);
    console.log('Connected to MongoDB');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening on http://localhost:${PORT}`);
      console.log(`Server also accessible on network at http://192.168.101.202:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
})();


