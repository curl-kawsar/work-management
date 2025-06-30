import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

const workOrderSchema = new mongoose.Schema({
  workOrderNumber: {
    type: String,
    required: [true, 'Work order number is required'],
    unique: true,
  },
  details: {
    type: String,
    required: [true, 'Work order details are required'],
  },
  address: {
    type: String,
    required: [true, 'Work order address is required'],
  },
  workType: {
    type: String,
    required: [true, 'Work type is required'],
  },
  scheduleDate: {
    type: Date,
    required: [true, 'Schedule date is required'],
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
  },
  nte: {
    type: Number,
    default: 0, // Not to Exceed amount
  },
  assignedStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  media: [{
    type: String, // File paths
  }],
  notes: [activitySchema],
  status: {
    type: String,
    enum: ['Created', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Created',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field on save
workOrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const WorkOrder = mongoose.models.WorkOrder || mongoose.model('WorkOrder', workOrderSchema);

export default WorkOrder; 