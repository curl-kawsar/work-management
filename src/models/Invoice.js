import mongoose from 'mongoose';

// Payment schema for client payments
const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'check', 'credit_card', 'bank_transfer', 'other']
  },
  description: {
    type: String
  },
  paymentDate: {
    type: Date,
    required: true
  }
});

// Expense schema for tracking different types of expenses
const expenseSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['material', 'labor', 'utility']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String
  },
  status: {
    type: String,
    required: true,
    enum: ['paid', 'unpaid'],
    default: 'unpaid'
  }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  workOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkOrder',
    required: true
  },
  clientPayments: [paymentSchema],
  expenses: [expenseSchema],
  totalClientPayment: {
    type: Number,
    required: true,
    min: 0
  },
  totalMaterialCost: {
    type: Number,
    required: true,
    min: 0
  },
  totalLaborCost: {
    type: Number,
    required: true,
    min: 0
  },
  totalUtilityCost: {
    type: Number,
    required: true,
    min: 0
  },
  revenue: {
    type: Number,
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'sent', 'paid', 'overdue'],
    default: 'draft'
  },
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Method to calculate revenue
invoiceSchema.methods.calculateRevenue = function() {
  // Sum of all client payments
  this.totalClientPayment = this.clientPayments.reduce((sum, payment) => sum + payment.amount, 0);
  
  // Sum expenses by type
  this.totalMaterialCost = this.expenses
    .filter(expense => expense.type === 'material')
    .reduce((sum, exp) => sum + exp.amount, 0);
    
  this.totalLaborCost = this.expenses
    .filter(expense => expense.type === 'labor')
    .reduce((sum, exp) => sum + exp.amount, 0);
    
  this.totalUtilityCost = this.expenses
    .filter(expense => expense.type === 'utility')
    .reduce((sum, exp) => sum + exp.amount, 0);
  
  // Calculate revenue
  this.revenue = this.totalClientPayment - (this.totalMaterialCost + this.totalLaborCost + this.totalUtilityCost);
  
  return this.revenue;
};

// Pre-save hook to calculate revenue
invoiceSchema.pre('save', function(next) {
  this.calculateRevenue();
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema); 