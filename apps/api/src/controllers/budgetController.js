const Budget = require('../models/Budget');
const Cost = require('../models/Cost');
const Project = require('../models/Project');
const { asyncHandler } = require('../middleware/error');
const { hasPermission } = require('../middleware/permissions');

// Create a new budget
const createBudget = asyncHandler(async (req, res) => {
  // Check permissions
  if (!hasPermission(req.user.role, 'projects.manage_settings')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const budgetData = {
    ...req.body,
    createdBy: req.user._id,
    lastModifiedBy: req.user._id
  };

  const budget = await Budget.create(budgetData);
  await budget.populate('project', 'name key');
  await budget.populate('createdBy', 'name email');

  res.status(201).json({
    message: 'Budget created successfully',
    budget
  });
});

// Get budgets for a project
const getProjectBudgets = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { status, page = 1, limit = 20 } = req.query;

  // Check permissions
  if (!hasPermission(req.user.role, 'projects.read')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const filter = { project: projectId };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const budgets = await Budget.find(filter)
    .populate('project', 'name key')
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Budget.countDocuments(filter);

  res.json({
    budgets,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    }
  });
});

// Get budget details with actual spending
const getBudgetDetails = asyncHandler(async (req, res) => {
  const { budgetId } = req.params;

  // Check permissions
  if (!hasPermission(req.user.role, 'projects.read')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const budget = await Budget.findById(budgetId)
    .populate('project', 'name key')
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email');

  if (!budget) {
    return res.status(404).json({ message: 'Budget not found' });
  }

  // Calculate actual spending
  const actualSpending = await Cost.aggregate([
    {
      $match: {
        project: budget.project._id,
        startDate: { $gte: budget.startDate, $lte: budget.endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        categoryBreakdown: {
          $push: {
            category: '$category',
            amount: '$amount'
          }
        }
      }
    }
  ]);

  const spending = actualSpending[0] || { totalAmount: 0, categoryBreakdown: [] };

  // Update budget with actual spending
  budget.actualSpending = spending.totalAmount;
  budget.remainingBudget = budget.totalBudget - spending.totalAmount;
  budget.variance = spending.totalAmount - budget.totalBudget;
  budget.variancePercentage = budget.totalBudget > 0 ? 
    (budget.variance / budget.totalBudget) * 100 : 0;

  await budget.save();

  // Category breakdown comparison
  const categoryComparison = budget.categoryBudgets.map(budgetCategory => {
    const actualCategory = spending.categoryBreakdown
      .filter(item => item.category === budgetCategory.category)
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      category: budgetCategory.category,
      budgeted: budgetCategory.amount,
      actual: actualCategory,
      variance: actualCategory - budgetCategory.amount,
      variancePercentage: budgetCategory.amount > 0 ? 
        ((actualCategory - budgetCategory.amount) / budgetCategory.amount) * 100 : 0
    };
  });

  res.json({
    budget,
    categoryComparison,
    spending: {
      total: spending.totalAmount,
      breakdown: spending.categoryBreakdown
    }
  });
});

// Update budget
const updateBudget = asyncHandler(async (req, res) => {
  const { budgetId } = req.params;
  
  // Check permissions
  if (!hasPermission(req.user.role, 'projects.manage_settings')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const updateData = {
    ...req.body,
    lastModifiedBy: req.user._id
  };

  const budget = await Budget.findByIdAndUpdate(
    budgetId, 
    updateData, 
    { new: true, runValidators: true }
  ).populate('project', 'name key')
   .populate('createdBy', 'name email')
   .populate('approvedBy', 'name email');

  if (!budget) {
    return res.status(404).json({ message: 'Budget not found' });
  }

  res.json({
    message: 'Budget updated successfully',
    budget
  });
});

// Approve budget
const approveBudget = asyncHandler(async (req, res) => {
  const { budgetId } = req.params;
  
  // Check permissions
  if (!hasPermission(req.user.role, 'projects.manage_settings')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const budget = await Budget.findByIdAndUpdate(
    budgetId,
    {
      status: 'active',
      approvedBy: req.user._id,
      approvedAt: new Date(),
      lastModifiedBy: req.user._id
    },
    { new: true }
  ).populate('project', 'name key')
   .populate('approvedBy', 'name email');

  if (!budget) {
    return res.status(404).json({ message: 'Budget not found' });
  }

  res.json({
    message: 'Budget approved successfully',
    budget
  });
});

// Delete budget
const deleteBudget = asyncHandler(async (req, res) => {
  const { budgetId } = req.params;
  
  // Check permissions
  if (!hasPermission(req.user.role, 'projects.manage_settings')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const budget = await Budget.findByIdAndDelete(budgetId);
  
  if (!budget) {
    return res.status(404).json({ message: 'Budget not found' });
  }

  res.json({ message: 'Budget deleted successfully' });
});

// Get budget alerts
const getBudgetAlerts = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Check permissions
  if (!hasPermission(req.user.role, 'projects.read')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const activeBudgets = await Budget.find({
    project: projectId,
    status: 'active',
    alertsEnabled: true
  });

  const alerts = [];

  for (const budget of activeBudgets) {
    // Calculate current spending
    const actualSpending = await Cost.aggregate([
      {
        $match: {
          project: budget.project,
          startDate: { $gte: budget.startDate, $lte: budget.endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const currentSpending = actualSpending[0]?.totalAmount || 0;
    const utilizationPercentage = (currentSpending / budget.totalBudget) * 100;

    if (utilizationPercentage >= budget.alertThresholds.critical) {
      alerts.push({
        type: 'critical',
        budget: budget.name,
        message: `Critical: Budget ${budget.name} is ${utilizationPercentage.toFixed(1)}% utilized`,
        utilizationPercentage,
        remainingBudget: budget.totalBudget - currentSpending
      });
    } else if (utilizationPercentage >= budget.alertThresholds.warning) {
      alerts.push({
        type: 'warning',
        budget: budget.name,
        message: `Warning: Budget ${budget.name} is ${utilizationPercentage.toFixed(1)}% utilized`,
        utilizationPercentage,
        remainingBudget: budget.totalBudget - currentSpending
      });
    }
  }

  res.json({ alerts });
});

module.exports = {
  createBudget,
  getProjectBudgets,
  getBudgetDetails,
  updateBudget,
  approveBudget,
  deleteBudget,
  getBudgetAlerts
};
