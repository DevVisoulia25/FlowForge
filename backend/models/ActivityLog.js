const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    orderNumber: {
      type: String
    },
    action: {
      type: String,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: {
      type: String
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    departmentName: {
      type: String
    },
    details: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

activityLogSchema.index({ companyId: 1, timestamp: -1 });
activityLogSchema.index({ companyId: 1, orderId: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
