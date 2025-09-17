const Cost = require('../models/Cost');
const Budget = require('../models/Budget');
const Project = require('../models/Project');
const { asyncHandler } = require('../middleware/error');
const { hasPermission } = require('../middleware/permissions');
const multer = require('multer');
const csv = require('csv-parser');
const ExcelJS = require('exceljs');
const { Readable } = require('stream');

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Create a new cost entry
const createCost = asyncHandler(async (req, res) => {
  try {
    // Check permissions
    if (!hasPermission(req.user.role, 'projects.manage_settings')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const costData = {
      description: req.body.description,
      amount: parseFloat(req.body.amount),
      currency: req.body.currency || 'USD',
      category: req.body.category,
      source: req.body.source,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      project: req.body.project,
      createdBy: req.user._id || req.user.id || '68c2a7a31ad5974f0ee25579',
      lastModifiedBy: req.user._id || req.user.id || '68c2a7a31ad5974f0ee25579'
    };

    const cost = await Cost.create(costData);

    res.status(201).json({
      message: 'Cost entry created successfully',
      cost: {
        _id: cost._id,
        description: cost.description,
        amount: cost.amount,
        currency: cost.currency,
        category: cost.category,
        source: cost.source,
        startDate: cost.startDate,
        endDate: cost.endDate,
        project: cost.project
      }
    });
  } catch (error) {
    console.error('Error creating cost:', error);
    console.error('Request body:', req.body);
    console.error('User:', req.user);
    res.status(400).json({
      message: 'Failed to create cost',
      error: error.message,
      validationErrors: error.errors,
      requestBody: req.body
    });
  }
});

// Get costs for a project
const getProjectCosts = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { 
    startDate, 
    endDate, 
    category, 
    source, 
    status,
    page = 1, 
    limit = 20,
    sortBy = 'startDate',
    sortOrder = 'desc'
  } = req.query;

  // Check permissions
  if (!hasPermission(req.user.role, 'projects.read')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  // Build filter
  const filter = { project: projectId };
  
  if (startDate || endDate) {
    filter.startDate = {};
    if (startDate) filter.startDate.$gte = new Date(startDate);
    if (endDate) filter.startDate.$lte = new Date(endDate);
  }
  
  if (category) filter.category = category;
  if (source) filter.source = new RegExp(source, 'i');
  if (status) filter.status = status;

  // Calculate pagination
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const costs = await Cost.find(filter)
    .populate('project', 'name key')
    .populate('sprint', 'name')
    .populate('issue', 'key title')
    .populate('createdBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Cost.countDocuments(filter);

  // Calculate summary statistics
  const summary = await Cost.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        averageAmount: { $avg: '$amount' },
        count: { $sum: 1 },
        categoryBreakdown: {
          $push: {
            category: '$category',
            amount: '$amount'
          }
        }
      }
    }
  ]);

  res.json({
    costs,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    },
    summary: summary[0] || {
      totalAmount: 0,
      averageAmount: 0,
      count: 0,
      categoryBreakdown: []
    }
  });
});

// Get cost analytics for a project
const getCostAnalytics = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { startDate, endDate } = req.query;

  // Check permissions
  if (!hasPermission(req.user.role, 'projects.read')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const filter = { project: projectId };
  if (startDate || endDate) {
    filter.startDate = {};
    if (startDate) filter.startDate.$gte = new Date(startDate);
    if (endDate) filter.startDate.$lte = new Date(endDate);
  }

  // Category breakdown
  const categoryBreakdown = await Cost.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  // Monthly spending trend
  const monthlyTrend = await Cost.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          year: { $year: '$startDate' },
          month: { $month: '$startDate' }
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Source breakdown
  const sourceBreakdown = await Cost.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$source',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  // Budget vs actual (if budget exists)
  const budget = await Budget.findOne({ 
    project: projectId, 
    status: 'active' 
  });

  let budgetComparison = null;
  if (budget) {
    const actualSpending = await Cost.aggregate([
      { $match: filter },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]);

    budgetComparison = {
      budgeted: budget.totalBudget,
      actual: actualSpending[0]?.totalAmount || 0,
      variance: (actualSpending[0]?.totalAmount || 0) - budget.totalBudget,
      variancePercentage: budget.totalBudget > 0 ? 
        (((actualSpending[0]?.totalAmount || 0) - budget.totalBudget) / budget.totalBudget) * 100 : 0
    };
  }

  res.json({
    categoryBreakdown,
    monthlyTrend,
    sourceBreakdown,
    budgetComparison
  });
});

// Import costs from CSV/Excel file
const importCosts = asyncHandler(async (req, res) => {
  // Check permissions
  if (!hasPermission(req.user.role, 'projects.manage_settings')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const { projectId } = req.params;
  const { file } = req;
  
  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const importBatch = `import_${Date.now()}`;
  const costs = [];
  const errors = [];

  try {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      // Process CSV
      const results = await new Promise((resolve, reject) => {
        const results = [];
        const stream = Readable.from(file.buffer);
        
        stream
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', reject);
      });

      for (let i = 0; i < results.length; i++) {
        try {
          const row = results[i];
          const costData = {
            description: row.description || row.Description || '',
            amount: parseFloat(row.amount || row.Amount || 0),
            currency: row.currency || row.Currency || 'USD',
            category: (row.category || row.Category || 'other').toLowerCase(),
            subcategory: row.subcategory || row.Subcategory || '',
            source: row.source || row.Source || 'Imported',
            startDate: new Date(row.startDate || row['Start Date'] || row.date || row.Date),
            endDate: new Date(row.endDate || row['End Date'] || row.startDate || row['Start Date'] || row.date || row.Date),
            project: projectId,
            importBatch,
            importSource: file.originalname,
            createdBy: req.user._id,
            lastModifiedBy: req.user._id
          };

          if (costData.amount > 0) {
            costs.push(costData);
          }
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }
    } else if (file.mimetype.includes('sheet') || file.originalname.endsWith('.xlsx')) {
      // Process Excel
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);
      const worksheet = workbook.worksheets[0];
      
      // Convert worksheet to JSON
      const jsonData = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const headerCell = worksheet.getCell(1, colNumber);
          const header = headerCell.value ? headerCell.value.toString().toLowerCase() : `column${colNumber}`;
          rowData[header] = cell.value;
        });
        if (Object.keys(rowData).length > 0) {
          jsonData.push(rowData);
        }
      });

      for (let i = 0; i < jsonData.length; i++) {
        try {
          const row = jsonData[i];
          const costData = {
            description: row.description || row.Description || '',
            amount: parseFloat(row.amount || row.Amount || 0),
            currency: row.currency || row.Currency || 'USD',
            category: (row.category || row.Category || 'other').toLowerCase(),
            subcategory: row.subcategory || row.Subcategory || '',
            source: row.source || row.Source || 'Imported',
            startDate: new Date(row.startDate || row['Start Date'] || row.date || row.Date),
            endDate: new Date(row.endDate || row['End Date'] || row.startDate || row['Start Date'] || row.date || row.Date),
            project: projectId,
            importBatch,
            importSource: file.originalname,
            createdBy: req.user._id,
            lastModifiedBy: req.user._id
          };

          if (costData.amount > 0) {
            costs.push(costData);
          }
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }
    } else {
      return res.status(400).json({ message: 'Unsupported file format' });
    }

    // Bulk insert costs
    if (costs.length > 0) {
      await Cost.insertMany(costs);
    }

    res.json({
      message: 'Costs imported successfully',
      imported: costs.length,
      errors: errors.length,
      importBatch,
      details: errors
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      message: 'Import failed', 
      error: error.message 
    });
  }
});

// Update cost entry
const updateCost = asyncHandler(async (req, res) => {
  const { costId } = req.params;
  
  // Check permissions
  if (!hasPermission(req.user.role, 'projects.manage_settings')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const updateData = {
    ...req.body,
    lastModifiedBy: req.user._id
  };

  const cost = await Cost.findByIdAndUpdate(
    costId, 
    updateData, 
    { new: true, runValidators: true }
  ).populate('project', 'name key')
   .populate('sprint', 'name')
   .populate('issue', 'key title');

  if (!cost) {
    return res.status(404).json({ message: 'Cost entry not found' });
  }

  res.json({
    message: 'Cost entry updated successfully',
    cost
  });
});

// Delete cost entry
const deleteCost = asyncHandler(async (req, res) => {
  const { costId } = req.params;
  
  // Check permissions
  if (!hasPermission(req.user.role, 'projects.manage_settings')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const cost = await Cost.findByIdAndDelete(costId);
  
  if (!cost) {
    return res.status(404).json({ message: 'Cost entry not found' });
  }

  res.json({ message: 'Cost entry deleted successfully' });
});

// Get cost categories
const getCostCategories = asyncHandler(async (req, res) => {
  const SystemConfig = require('../models/SystemConfig');
  const systemConfig = await SystemConfig.getSystemConfig();
  const activeCategories = systemConfig.costCategories.filter(cc => cc.isActive);
  res.json({ categories: activeCategories });
});

module.exports = {
  createCost,
  getProjectCosts,
  getCostAnalytics,
  importCosts,
  updateCost,
  deleteCost,
  getCostCategories,
  upload
};
