'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getSystemConfig,
  updateSystemConfig,
  addFieldType,
  updateFieldType,
  deleteFieldType,
  addCostCategory,
  updateCostCategory,
  deleteCostCategory,
  getFieldTypes,
  getCostCategories,
  getWorkflowTemplates,
  updateWorkflowTemplate
} = require('../controllers/systemConfigController');

// Apply authentication to all routes
router.use(authenticate);

// Simple test route
router.get('/test-simple', (req, res) => {
  res.json({ message: 'Simple test route working' });
});

// Workflow templates routes
router.get('/workflow-templates', (req, res) => {
  console.log('🔍 GET /workflow-templates route hit');
  res.json({ templates: [] });
});

router.put('/workflow-templates', (req, res) => {
  console.log('🔍 PUT /workflow-templates route hit');
  res.json({ message: 'Workflow template updated' });
});

// Field types routes
router.get('/field-types', getFieldTypes);
router.post('/field-types', addFieldType);
router.put('/field-types/:fieldTypeValue', updateFieldType);
router.delete('/field-types/:fieldTypeValue', deleteFieldType);

// Cost categories routes
router.get('/cost-categories', getCostCategories);
router.post('/cost-categories', addCostCategory);
router.put('/cost-categories/:categoryValue', updateCostCategory);
router.delete('/cost-categories/:categoryValue', deleteCostCategory);

// System configuration routes
router.get('/', getSystemConfig);
router.put('/', updateSystemConfig);

module.exports = router;
