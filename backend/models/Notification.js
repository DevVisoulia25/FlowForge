const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    recipientRole: {
      type: String,
      enum: ['owner', 'department', 'all'],
      default: 'all'
    },
    recipientDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: [
        'NEW_ORDER',
        'STAGE_COMPLETED',
        'ORDER_COMPLETED',
        'SETUP_COMPLETED',
        'REVERT_REQUESTED',
        'REVERT_APPROVED',
        'REVERT_REJECTED',
        'DEPT_ACCOUNT_UPDATED',
        'DEADLINE_APPROACHING',
        'DEADLINE_MISSED'
      ],
      default: 'STAGE_COMPLETED'
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

notificationSchema.index({ companyId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
