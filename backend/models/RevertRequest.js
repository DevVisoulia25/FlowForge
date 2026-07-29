const mongoose = require('mongoose');

const revertRequestSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    orderNumber: {
      type: String,
      required: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    requestedByName: {
      type: String
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    departmentName: {
      type: String
    },
    currentStageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stage',
      required: true
    },
    currentStageName: {
      type: String
    },
    requestedPreviousStageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stage',
      required: true
    },
    requestedPreviousStageName: {
      type: String
    },
    requestedPreviousDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    reason: {
      type: String,
      required: [true, 'Reason is required']
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedByName: {
      type: String
    },
    actionDate: {
      type: Date
    }
  },
  { timestamps: true }
);

revertRequestSchema.index({ companyId: 1, status: 1 });
revertRequestSchema.index({ companyId: 1, orderId: 1 });

module.exports = mongoose.model('RevertRequest', revertRequestSchema);
