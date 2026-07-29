const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Stage name is required'],
      trim: true
    },
    orderIndex: {
      type: Number,
      required: true,
      default: 0
    }
  },
  { timestamps: true }
);

stageSchema.index({ companyId: 1, orderIndex: 1 });

module.exports = mongoose.model('Stage', stageSchema);
