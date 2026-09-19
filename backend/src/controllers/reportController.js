const Lead = require('../models/Lead');
const CallHistory = require('../models/CallHistory');
const { success, error } = require('../utils/apiResponse');

/**
 * Generate aggregated reports by:
 * - State
 * - Employee
 * - Status
 * - Source
 */
const getReports = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};

    /* Date filter */
    if (startDate || endDate) {
      dateFilter.createdAt = {};

      if (startDate) {
        const start = new Date(startDate);

        if (isNaN(start.getTime())) {
          return error(
            res,
            'Invalid start date',
            'INVALID_DATE',
            400
          );
        }

        start.setHours(0, 0, 0, 0);
        dateFilter.createdAt.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);

        if (isNaN(end.getTime())) {
          return error(
            res,
            'Invalid end date',
            'INVALID_DATE',
            400
          );
        }

        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    const [
      stateStats,
      statusStats,
      employeeCallStats,
      sourceStats
    ] = await Promise.all([

      /* ================================
         1. LEADS BY STATE
         ================================ */

      Lead.aggregate([
        {
          $match: {
            isDeleted: false,
            ...dateFilter
          }
        },
        {
          $group: {
            _id: {
              $ifNull: ['$state', 'Unknown']
            },

            totalLeads: {
              $sum: 1
            },

            interested: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      '$currentStatus',
                      'INTERESTED'
                    ]
                  },
                  1,
                  0
                ]
              }
            },

            enrolled: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      '$currentStatus',
                      [
                        'PAYMENT_COMPLETED',
                        'ENROLLED'
                      ]
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $sort: {
            totalLeads: -1
          }
        }
      ]),

      /* ================================
         2. LEADS BY STATUS
         ================================ */

      Lead.aggregate([
        {
          $match: {
            isDeleted: false,
            ...dateFilter
          }
        },
        {
          $group: {
            _id: {
              $ifNull: [
                '$currentStatus',
                'UNKNOWN'
              ]
            },

            count: {
              $sum: 1
            }
          }
        },
        {
          $sort: {
            count: -1
          }
        }
      ]),

      /* ================================
         3. CALLS BY EMPLOYEE
         ================================ */

      CallHistory.aggregate([
        {
          $match: {
            ...dateFilter
          }
        },
        {
          $group: {
            _id: {
              $ifNull: [
                '$employeeNameSnapshot',
                'Unknown'
              ]
            },

            totalCalls: {
              $sum: 1
            },

            interested: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      '$callStatus',
                      'INTERESTED'
                    ]
                  },
                  1,
                  0
                ]
              }
            },

            totalDurationSec: {
              $sum: {
                $ifNull: [
                  '$duration',
                  0
                ]
              }
            }
          }
        },
        {
          $sort: {
            totalCalls: -1
          }
        }
      ]),

      /* ================================
         4. LEADS BY SOURCE
         ================================ */

      Lead.aggregate([
        {
          $match: {
            isDeleted: false,
            ...dateFilter
          }
        },
        {
          $group: {
            _id: {
              $ifNull: [
                '$source',
                'UNKNOWN'
              ]
            },

            count: {
              $sum: 1
            }
          }
        },
        {
          $sort: {
            count: -1
          }
        }
      ])
    ]);

    /* ================================
       RESPONSE
       ================================ */

    return success(
      res,
      {
        stateStats,
        statusStats,
        employeeCallStats,
        sourceStats
      },
      'Reports generated successfully'
    );

  } catch (err) {
    next(err);
  }
};

module.exports = {
  getReports
};