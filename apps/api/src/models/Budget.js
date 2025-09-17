const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  // Basic Information
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String, 
    trim: true 
  },
  
  // Budget Period
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  period: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly', 'custom'],
    default: 'monthly'
  },
  
  // Project Association
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  
  // Budget Amounts
  totalBudget: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  currency: { 
    type: String, 
    default: 'USD', 
    uppercase: true 
  },
  
  // Category Breakdown
  categoryBudgets: [{
    category: {
      type: String,
      required: true,
      enum: ['aws', 'lucid', 'tools', 'infrastructure', 'software', 'hardware', 'services', 'other']
    },
    amount: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    percentage: { 
      type: Number, 
      min: 0, 
      max: 100 
    }
  }],
  
  // Actual Spending (calculated)
  actualSpending: { 
    type: Number, 
    default: 0 
  },
  remainingBudget: { 
    type: Number, 
    default: 0 
  },
  variance: { 
    type: Number, 
    default: 0 
  }, // actual - budgeted
  variancePercentage: { 
    type: Number, 
    default: 0 
  },
  
  // Alerts and Thresholds
  alertThresholds: {
    warning: { 
      type: Number, 
      default: 80 
    }, // Percentage of budget used
    critical: { 
      type: Number, 
      default: 95 
    }
  },
  alertsEnabled: { 
    type: Boolean, 
    default: true 
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  
  // Approval
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: { 
    type: Date 
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

// Indexes
BudgetSchema.index({ project: 1, startDate: -1 });
BudgetSchema.index({ status: 1 });
BudgetSchema.index({ startDate: 1, endDate: 1 });

// Virtual for budget utilization percentage
BudgetSchema.virtual('utilizationPercentage').get(function() {
  if (this.totalBudget === 0) return 0;
  return (this.actualSpending / this.totalBudget) * 100;
});

// Virtual for days remaining
BudgetSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const endDate = new Date(this.endDate);
  if (endDate <= now) return 0;
  const diffTime = endDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to calculate derived fields
BudgetSchema.pre('save', function(next) {
  // Calculate remaining budget
  this.remainingBudget = this.totalBudget - this.actualSpending;
  
  // Calculate variance
  this.variance = this.actualSpending - this.totalBudget;
  
  // Calculate variance percentage
  if (this.totalBudget > 0) {
    this.variancePercentage = (this.variance / this.totalBudget) * 100;
  }
  
  next();
});

module.exports = mongoose.model('Budget', BudgetSchema);
