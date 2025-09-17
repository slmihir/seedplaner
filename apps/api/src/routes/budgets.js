const express = require('express');
const router = express.Router();
const { 
  createBudget, 
  getProjectBudgets, 
  getBudgetDetails, 
  updateBudget, 
  approveBudget, 
  deleteBudget,
  getBudgetAlerts
} = require('../controllers/budgetController');
const { authenticate } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get budget alerts
router.get('/alerts/:projectId', getBudgetAlerts);

// Get project budgets
router.get('/project/:projectId', getProjectBudgets);

// Get budget details
router.get('/:budgetId', getBudgetDetails);

// Create budget
router.post('/', createBudget);

// Update budget
router.patch('/:budgetId', updateBudget);

// Approve budget
router.patch('/:budgetId/approve', approveBudget);

// Delete budget
router.delete('/:budgetId', deleteBudget);

module.exports = router;
