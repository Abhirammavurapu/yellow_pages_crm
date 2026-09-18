const mongoose = require('mongoose');

const callHistorySchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    employeeNameSnapshot: {
      type: String,
      required: true
    },
    employeeRoleSnapshot: {
      type: String,
      default: ''
    },
    phoneNumber: {
      type: String,
      required: true
    },
    callStatus: {
      type: String,
      required: true,
      index: true
    },
    callStartTime: {
      type: Date,
      default: Date.now
    },
    callEndTime: {
      type: Date,
      default: Date.now
    },
    duration: {
      type: Number, // duration in seconds
      default: 0
    },
    notes: {
      type: String,
      default: ''
    },
    followUpDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

callHistorySchema.index({ leadId: 1, createdAt: -1 });
callHistorySchema.index({ employeeId: 1, createdAt: -1 });

module.exports = mongoose.model('CallHistory', callHistorySchema);
