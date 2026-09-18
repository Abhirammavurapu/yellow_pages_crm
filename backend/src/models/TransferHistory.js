const mongoose = require('mongoose');

const transferHistorySchema = new mongoose.Schema(
  {
    fromEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    fromEmployeeName: {
      type: String,
      required: true
    },
    toEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    toEmployeeName: {
      type: String,
      required: true
    },
    transferredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    transferredByName: {
      type: String,
      required: true
    },
    transferDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    reason: {
      type: String,
      default: 'Employee Resignation / Reallocation'
    },
    leadCount: {
      type: Number,
      required: true
    },
    leadsAffected: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead'
      }
    ],
    followUpsAffectedCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('TransferHistory', transferHistorySchema);
