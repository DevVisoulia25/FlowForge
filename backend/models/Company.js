const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    logo: {
      type: String,
      default: ''
    },
    industry: {
      type: String,
      default: 'General Manufacturing'
    },
    address: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    },
    workingHours: {
      type: String,
      default: '08:00 - 17:00'
    },
    isSetupComplete: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);
