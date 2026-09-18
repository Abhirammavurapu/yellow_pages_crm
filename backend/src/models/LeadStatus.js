const mongoose = require('mongoose');

const leadStatusSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    label: {
      type: String,
      required: true,
      trim: true
    },
    color: {
      type: String,
      default: 'blue' // badge color (e.g. green, red, amber, blue, purple, gray)
    },
    isSystem: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('LeadStatus', leadStatusSchema);
