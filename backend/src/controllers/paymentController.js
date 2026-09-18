const Payment = require('../models/Payment');
const Lead = require('../models/Lead');
const Enrollment = require('../models/Enrollment');
const Listing = require('../models/Listing');
const { success, error } = require('../utils/apiResponse');
const { logActivity } = require('../services/activityService');

/**
 * Get payments
 */
const getPayments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search
    } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(
      Math.max(parseInt(limit, 10) || 20, 1),
      100
    );

    const query = {};

    if (status) {
      query.paymentStatus = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );

      const leads = await Lead.find({
        $or: [
          { businessName: searchRegex },
          { leadId: searchRegex },
          { city: searchRegex },
          { state: searchRegex }
        ]
      }).select('_id');

      query.$or = [
        { transactionReference: searchRegex },
        { leadId: { $in: leads.map(lead => lead._id) } }
      ];
    }

    const skip =
      (pageNumber - 1) * limitNumber;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate(
          'leadId',
          'businessName leadId phoneNumbers city state'
        )
        .populate(
          'collectedBy',
          'name employeeId'
        )
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limitNumber),

      Payment.countDocuments(query)
    ]);

    const totalRevenueResult =
      await Payment.aggregate([
        {
          $match: {
            paymentStatus: 'COMPLETED'
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$amount'
            }
          }
        }
      ]);

    const totalRevenue =
      totalRevenueResult[0]?.total || 0;

    return success(
      res,
      payments,
      'Payments retrieved',
      200,
      {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages:
          Math.ceil(
            total / limitNumber
          ),
        totalRevenue
      }
    );

  } catch (err) {
    next(err);
  }
};


/**
 * Create new payment
 */
const createPayment = async (
  req,
  res,
  next
) => {
  try {
    const {
      leadId,
      amount,
      paymentMethod,
      transactionReference,
      notes,
      createEnrollment = true,
      plan = 'GOLD'
    } = req.body;

    if (!leadId || amount === undefined) {
      return error(
        res,
        'Lead ID and amount are required',
        'MISSING_FIELDS',
        400
      );
    }

    const paymentAmount =
      Number(amount);

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0
    ) {
      return error(
        res,
        'Payment amount must be greater than 0',
        'INVALID_AMOUNT',
        400
      );
    }

    const lead =
      await Lead.findById(leadId);

    if (
      !lead ||
      lead.isDeleted
    ) {
      return error(
        res,
        'Lead not found',
        'NOT_FOUND',
        404
      );
    }


    /**
     * Save Payment to MongoDB
     */
    const payment =
      await Payment.create({
        leadId: lead._id,
        amount: paymentAmount,
        paymentStatus: 'COMPLETED',
        paymentMethod:
          paymentMethod || 'UPI',
        transactionReference:
          transactionReference || '',
        collectedBy:
          req.user._id,
        collectedByName:
          req.user.name,
        notes:
          notes || '',
        paymentDate:
          new Date()
      });


    /**
     * Update Lead
     */
    lead.currentStatus =
      'PAYMENT_COMPLETED';

    await lead.save();


    await logActivity({
      actor: req.user,
      action: 'PAYMENT_COMPLETED',
      entityType: 'PAYMENT',
      entityId: payment._id,
      leadId: lead._id,
      newValue: {
        amount: paymentAmount,
        paymentMethod:
          paymentMethod || 'UPI',
        transactionReference:
          transactionReference || ''
      }
    });


    let enrollment = null;
    let listing = null;


    /**
     * Create Enrollment + Listing
     */
    if (createEnrollment) {

      lead.currentStatus =
        'ENROLLED';

      await lead.save();


      /**
       * Save Enrollment to MongoDB
       */
      enrollment =
        await Enrollment.findOneAndUpdate(
          { leadId: lead._id },
          {
            $set: {
              enrollmentStatus:
                'ACTIVE',
              enrollmentDate:
                new Date(),
              plan,
              listingStatus:
                'ACTIVE',
              enrolledBy:
                req.user._id
            }
          },
          {
            upsert: true,
            new: true,
            runValidators: true
          }
        );


      /**
       * Save Listing to MongoDB
       */
      listing =
        await Listing.findOneAndUpdate(
          { leadId: lead._id },
          {
            $set: {
              businessName:
                lead.businessName,
              category:
                lead.category,
              description:
                `Verified listing on Yellow Pages for ${lead.businessName}`,
              phone:
                lead.phoneNumbers?.[0] || '',
              email:
                lead.email || '',
              website:
                lead.website || '',
              address:
                lead.address || '',
              city:
                lead.city || '',
              district:
                lead.district || '',
              state:
                lead.state || '',
              pincode:
                lead.pincode || '',
              listingStatus:
                'ACTIVE'
            }
          },
          {
            upsert: true,
            new: true,
            runValidators: true
          }
        );


      await logActivity({
        actor: req.user,
        action:
          'ENROLLMENT_COMPLETED',
        entityType:
          'ENROLLMENT',
        entityId:
          enrollment._id,
        leadId:
          lead._id,
        newValue: {
          plan,
          listingId:
            listing._id
        }
      });
    }


    return success(
      res,
      {
        payment,
        enrollment,
        listing
      },
      'Payment logged and business enrolled',
      201
    );

  } catch (err) {
    next(err);
  }
};


module.exports = {
  getPayments,
  createPayment
};