const mongoose = require('mongoose');
const { LISTING_STATUS } = require('../config/constants');

const enrollmentSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      unique: true,
      index: true
    },
    enrollmentStatus: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true
    },
    enrollmentDate: {
      type: Date,
      default: Date.now
    },
    plan: {
      type: String,
      enum: ['BASIC', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'],
      default: 'GOLD'
    },
    listingStatus: {
      type: String,
      enum: Object.values(LISTING_STATUS),
      default: LISTING_STATUS.ACTIVE,
      index: true
    },
    listingDate: {
      type: Date,
      default: Date.now
    },
    validTill: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    },
    enrolledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Enrollment', enrollmentSchema);
