const express = require('express');
const router = express.Router();
const { 
  createCost, 
  getProjectCosts, 
  getCostAnalytics, 
  importCosts, 
  updateCost, 
  deleteCost, 
  getCostCategories,
  upload
} = require('../controllers/costController');
const { authenticate } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get cost categories
router.get('/categories', getCostCategories);

// Import costs from file
router.post('/import/:projectId', upload.single('file'), importCosts);

// Get project costs
router.get('/project/:projectId', getProjectCosts);

// Get cost analytics
router.get('/analytics/:projectId', getCostAnalytics);

// Create cost
router.post('/', createCost);

// Update cost
router.patch('/:costId', updateCost);

// Delete cost
router.delete('/:costId', deleteCost);

module.exports = router;
