const mongoose = require('mongoose');
const { LISTING_STATUS } = require('../config/constants');

const listingSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    description: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      required: true,
      index: true
    },
    district: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      required: true,
      index: true
    },
    pincode: {
      type: String,
      default: ''
    },
    images: [
      {
        type: String
      }
    ],
    services: [
      {
        type: String
      }
    ],
    listingStatus: {
      type: String,
      enum: Object.values(LISTING_STATUS),
      default: LISTING_STATUS.ACTIVE,
      index: true
    },
    views: {
      type: Number,
      default: 0
    },
    inquiries: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

listingSchema.index({ city: 1, category: 1 });
listingSchema.index({ state: 1, city: 1 });

module.exports = mongoose.model('Listing', listingSchema);
