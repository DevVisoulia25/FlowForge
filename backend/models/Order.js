const mongoose = require('mongoose');

const stageHistorySchema = new mongoose.Schema(
  {
    stageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stage'
    },
    stageName: { type: String, required: true },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    departmentName: { type: String, required: true },
    enteredAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedByName: { type: String },
    remarks: { type: String, default: '' }
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    orderNumber: {
      type: String,
      required: [true, 'Order number is required'],
      trim: true
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    remarks: {
      type: String,
      default: ''
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    currentStageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stage',
      required: true
    },
    currentDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Delayed', 'Pending Revert Approval'],
      default: 'In Progress'
    },
    creationTime: {
      type: Date,
      default: Date.now
    },
    completionTime: {
      type: Date
    },
    stageHistory: [stageHistorySchema]
  },
  { timestamps: true }
);

orderSchema.index({ companyId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ companyId: 1, currentDepartmentId: 1, status: 1 });
orderSchema.index({ companyId: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
