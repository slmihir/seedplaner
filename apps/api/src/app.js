'use strict';

require('dotenv').config({ path: '../../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/error');

const app = express();

// Security and common middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false, // Disable CORP for development
  crossOriginOpenerPolicy: false // Disable COOP for development
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Database health check
app.get('/db-health', async (req, res) => {
  try {
    // If using Mongoose (MongoDB)
    const mongoose = require('mongoose');
    if (mongoose && mongoose.connection && mongoose.connection.readyState) {
      // 1 = connected, 2 = connecting, 3 = disconnecting
      if (mongoose.connection.readyState !== 1) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      // Ping the DB to be sure
      await mongoose.connection.db.admin().ping();
      return res.status(200).json({ message: 'Database connected' });
    }

    // Example for SQL drivers (pseudo - replace with your client instance)
    // const sqlClient = require('./config/sql');
    // await sqlClient.query('SELECT 1');
    // return res.status(200).json({ message: 'Database connected' });

    // If we reach here, we couldn't determine DB client
    return res.status(500).json({ message: 'Database not connected' });
  } catch (err) {
    return res.status(500).json({ message: 'Database not connected' });
  }
});

// API routes
app.use('/api', routes);

// 404 and error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;


