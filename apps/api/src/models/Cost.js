const mongoose = require('mongoose');

const CostSchema = new mongoose.Schema({
  // Basic Information
  description: { 
    type: String, 
    required: true, 
    trim: true 
  },
  amount: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  currency: { 
    type: String, 
    default: 'USD', 
    uppercase: true 
  },
  
  // Categorization
  category: {
    type: String,
    required: true,
    enum: ['aws', 'lucid', 'tools', 'infrastructure', 'software', 'hardware', 'services', 'other'],
    lowercase: true
  },
  subcategory: { 
    type: String, 
    trim: true 
  },
  source: { 
    type: String, 
    required: true, 
    trim: true 
  }, // e.g., "AWS Billing", "Lucidchart Invoice", "Tool Subscription"
  
  // Time Period
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  billingPeriod: { 
    type: String, 
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'one-time'],
    default: 'monthly'
  },
  
  // Project Association
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  sprint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sprint'
  },
  issue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue'
  },
  
  // Cost Allocation
  allocationType: {
    type: String,
    enum: ['project', 'sprint', 'issue', 'team', 'department'],
    default: 'project'
  },
  allocationPercentage: { 
    type: Number, 
    min: 0, 
    max: 100, 
    default: 100 
  },
  
  // Budget Information
  budgetCategory: { 
    type: String, 
    trim: true 
  },
  isBudgeted: { 
    type: Boolean, 
    default: false 
  },
  budgetVariance: { 
    type: Number, 
    default: 0 
  }, // actual - budgeted
  
  // Metadata
  tags: [{ 
    type: String, 
    trim: true 
  }],
  notes: { 
    type: String, 
    trim: true 
  },
  
  // Import Information
  importBatch: { 
    type: String, 
    trim: true 
  }, // For tracking imported costs
  importSource: { 
    type: String, 
    trim: true 
  }, // File name or source system
  externalId: { 
    type: String, 
    trim: true 
  }, // ID from external system
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid', 'disputed'],
    default: 'pending'
  },
  
  // Approval Workflow
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: { 
    type: Date 
  },
  rejectionReason: { 
    type: String, 
    trim: true 
  },
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Indexes for efficient querying
CostSchema.index({ project: 1, startDate: -1 });
CostSchema.index({ category: 1, startDate: -1 });
CostSchema.index({ source: 1, startDate: -1 });
CostSchema.index({ importBatch: 1 });
CostSchema.index({ status: 1 });
CostSchema.index({ startDate: 1, endDate: 1 });

// Virtual for formatted amount
CostSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount);
});

// Virtual for duration in days
CostSchema.virtual('durationDays').get(function() {
  const diffTime = Math.abs(this.endDate - this.startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to calculate budget variance
CostSchema.pre('save', function(next) {
  if (this.isBudgeted && this.budgetedAmount) {
    this.budgetVariance = this.amount - this.budgetedAmount;
  }
  next();
});

module.exports = mongoose.model('Cost', CostSchema);
