const mongoose = require('mongoose');
const { FOLLOW_UP_STATUS } = require('../config/constants');

const followUpSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    createdByNameSnapshot: {
      type: String,
      default: ''
    },
    followUpDate: {
      type: Date,
      required: true,
      index: true
    },
    followUpTime: {
      type: String,
      default: '10:00 AM'
    },
    notes: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: Object.values(FOLLOW_UP_STATUS),
      default: FOLLOW_UP_STATUS.PENDING,
      index: true
    },
    completedAt: {
      type: Date,
      default: null
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    }
  },
  {
    timestamps: true
  }
);

followUpSchema.index({ assignedTo: 1, status: 1, followUpDate: 1 });

module.exports = mongoose.model('FollowUp', followUpSchema);
