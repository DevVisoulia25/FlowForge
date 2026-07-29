const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true
    },
    orderIndex: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

departmentSchema.index({ companyId: 1, orderIndex: 1 });

module.exports = mongoose.model('Department', departmentSchema);
