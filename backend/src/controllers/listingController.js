const Listing = require('../models/Listing');
const { success, error } = require('../utils/apiResponse');

/**
 * Get Yellow Pages Listings
 */
const getListings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      city,
      state,
      category,
      search,
      status
    } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(
      Math.max(parseInt(limit, 10) || 20, 1),
      100
    );

    const query = {};

    if (status) {
      query.listingStatus = status;
    }

    if (city) {
      query.city = new RegExp(
        `^${city.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
        'i'
      );
    }

    if (state) {
      query.state = new RegExp(
        `^${state.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
        'i'
      );
    }

    if (category) {
      query.category = category;
    }

    if (search && search.trim()) {
      const escapedSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const searchRegex = new RegExp(
        escapedSearch,
        'i'
      );

      query.$or = [
        { businessName: searchRegex },
        { phone: searchRegex },
        { category: searchRegex },
        { city: searchRegex }
      ];
    }

    const skip =
      (pageNumber - 1) * limitNumber;

    const [listings, total] = await Promise.all([
      Listing.find(query)
        .populate(
          'leadId',
          'leadId ownerName currentStatus'
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),

      Listing.countDocuments(query)
    ]);

    return success(
      res,
      listings,
      'Listings retrieved',
      200,
      {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(
          total / limitNumber
        )
      }
    );

  } catch (err) {
    next(err);
  }
};


/**
 * Update a Listing
 */
const updateListing = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const updateData = {
      ...req.body
    };

    const listing =
      await Listing.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true
        }
      );

    if (!listing) {
      return error(
        res,
        'Listing not found',
        'NOT_FOUND',
        404
      );
    }

    return success(
      res,
      listing,
      'Listing updated successfully'
    );

  } catch (err) {
    next(err);
  }
};


module.exports = {
  getListings,
  updateListing
};