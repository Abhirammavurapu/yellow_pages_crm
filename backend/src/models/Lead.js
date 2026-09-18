const mongoose = require('mongoose');
const { LEAD_SOURCES, LEAD_PRIORITY, DEFAULT_LEAD_STATUSES } = require('../config/constants');

const assignmentHistorySchema = new mongoose.Schema(
  {
    fromEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    toEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      default: 'Manual Assignment'
    }
  },
  { _id: true }
);

const leadSchema = new mongoose.Schema(
  {
    leadId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    ownerName: {
      type: String,
      trim: true,
      default: ''
    },
    phoneNumbers: [
      {
        type: String,
        trim: true,
        index: true
      }
    ],
    alternatePhoneNumbers: [
      {
        type: String,
        trim: true
      }
    ],
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    website: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: String,
      trim: true,
      default: 'General'
    },
    subCategory: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      index: true,
      default: ''
    },
    district: {
      type: String,
      trim: true,
      index: true,
      default: ''
    },
    state: {
      type: String,
      trim: true,
      index: true,
      default: ''
    },
    pincode: {
      type: String,
      trim: true,
      index: true,
      default: ''
    },
    country: {
      type: String,
      default: 'India'
    },
    source: {
      type: String,
      enum: Object.values(LEAD_SOURCES),
      default: LEAD_SOURCES.YELLOW_PAGES,
      index: true
    },
    sourceDetails: {
      type: String,
      default: ''
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true
    },
    assignedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
      index: true
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    assignmentDate: {
      type: Date,
      default: null
    },
    currentStatus: {
      type: String,
      default: 'NEW',
      index: true
    },
    priority: {
      type: String,
      enum: Object.values(LEAD_PRIORITY),
      default: LEAD_PRIORITY.MEDIUM,
      index: true
    },
    nextFollowUpDate: {
      type: Date,
      default: null,
      index: true
    },
    lastContactedAt: {
      type: Date,
      default: null
    },
    // Atomic Lead Locking System
    lock: {
      isLocked: {
        type: Boolean,
        default: false,
        index: true
      },
      lockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null
      },
      lockedAt: {
        type: Date,
        default: null
      },
      lockExpiresAt: {
        type: Date,
        default: null,
        index: true
      }
    },
    // Historical tracking
    assignmentHistory: [assignmentHistorySchema],
    previousOwners: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
      }
    ],
    notes: [
      {
        text: String,
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employee'
        },
        authorName: String,
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for optimal query performance
leadSchema.index({ phoneNumbers: 1, isDeleted: 1 });
leadSchema.index({ state: 1, district: 1, city: 1, currentStatus: 1 });
leadSchema.index({ assignedTo: 1, currentStatus: 1, isDeleted: 1 });
leadSchema.index({ 'lock.isLocked': 1, 'lock.lockExpiresAt': 1 });
leadSchema.index({ nextFollowUpDate: 1, assignedTo: 1 });
leadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
