const Lead = require('../models/Lead');
const Employee = require('../models/Employee');
const CallHistory = require('../models/CallHistory');
const FollowUp = require('../models/FollowUp');
const Payment = require('../models/Payment');
const Team = require('../models/Team');
const Activity = require('../models/Activity');

const { success } = require('../utils/apiResponse');
const {
  ROLES,
  EMPLOYEE_STATUS
} = require('../config/constants');


/**
 * Get dashboard metrics summary
 * GET /api/dashboard/summary
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user || !user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }


    // -----------------------------------------
    // Role checks
    // -----------------------------------------

    const isDirectAgent = [
      ROLES.EMPLOYEE,
      ROLES.TELECALLER,
      ROLES.BDE
    ].includes(user.role);

    const isTeamLead =
      user.role === ROLES.TEAM_LEAD;


    // -----------------------------------------
    // Base filters
    // -----------------------------------------

    let leadFilter = {
      isDeleted: false
    };

    let callFilter = {};

    let followUpFilter = {};

    let activityFilter = {};

    let paymentFilter = {
      paymentStatus: 'COMPLETED'
    };


    // -----------------------------------------
    // Employee / Telecaller / BDE
    // -----------------------------------------

    if (isDirectAgent) {

      leadFilter.assignedTo =
        user._id;

      callFilter.employeeId =
        user._id;

      followUpFilter.assignedTo =
        user._id;

      activityFilter.actor =
        user._id;

      /*
       * If your Payment model has employeeId,
       * this will scope revenue to the user.
       */
      paymentFilter.employeeId =
        user._id;
    }


    // -----------------------------------------
    // Team Lead
    // -----------------------------------------

    else if (isTeamLead) {

      const myTeams =
        await Team.find({
          teamLeadId: user._id
        });


      const members =
        myTeams.flatMap(
          team => team.members || []
        );


      const teamIds =
        myTeams.map(
          team => team._id
        );


      const scopeUsers = [
        ...members,
        user._id
      ];


      leadFilter.$or = [
        {
          assignedTeam: {
            $in: teamIds
          }
        },
        {
          assignedTo: {
            $in: scopeUsers
          }
        }
      ];


      callFilter.employeeId = {
        $in: scopeUsers
      };


      followUpFilter.assignedTo = {
        $in: scopeUsers
      };


      activityFilter.actor = {
        $in: scopeUsers
      };


      /*
       * If Payment has employeeId
       */
      paymentFilter.employeeId = {
        $in: scopeUsers
      };
    }


    // -----------------------------------------
    // Date range
    // -----------------------------------------

    const startOfToday =
      new Date();

    startOfToday.setHours(
      0,
      0,
      0,
      0
    );


    const endOfToday =
      new Date();

    endOfToday.setHours(
      23,
      59,
      59,
      999
    );


    // -----------------------------------------
    // Dashboard metrics
    // -----------------------------------------

    const [
      totalLeads,
      newLeads,
      interestedLeads,
      readyForPaymentLeads,
      enrolledLeads,
      callsToday,
      followUpsToday,
      overdueFollowUps,
      activeEmployees,
      resignedEmployees,
      totalRevenue
    ] = await Promise.all([

      Lead.countDocuments(
        leadFilter
      ),

      Lead.countDocuments({
        ...leadFilter,
        currentStatus: 'NEW'
      }),

      Lead.countDocuments({
        ...leadFilter,
        currentStatus: 'INTERESTED'
      }),

      Lead.countDocuments({
        ...leadFilter,
        currentStatus: 'READY_FOR_PAYMENT'
      }),

      Lead.countDocuments({
        ...leadFilter,
        currentStatus: {
          $in: [
            'PAYMENT_COMPLETED',
            'ENROLLED'
          ]
        }
      }),

      CallHistory.countDocuments({
        ...callFilter,
        createdAt: {
          $gte: startOfToday,
          $lte: endOfToday
        }
      }),

      FollowUp.countDocuments({
        ...followUpFilter,
        status: 'PENDING',
        followUpDate: {
          $gte: startOfToday,
          $lte: endOfToday
        }
      }),

      FollowUp.countDocuments({
        ...followUpFilter,
        status: 'PENDING',
        followUpDate: {
          $lt: startOfToday
        }
      }),

      Employee.countDocuments({
        status:
          EMPLOYEE_STATUS.ACTIVE,
        isDeleted: false
      }),

      Employee.countDocuments({
        status:
          EMPLOYEE_STATUS.RESIGNED,
        isDeleted: false
      }),

      Payment.aggregate([
        {
          $match:
            paymentFilter
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$amount'
            }
          }
        }
      ])
    ]);


    // -----------------------------------------
    // Recent activities
    // -----------------------------------------

    const recentActivities =
      await Activity.find(
        activityFilter
      )
        .populate(
          'actor',
          'name employeeId role'
        )
        .sort({
          timestamp: -1
        })
        .limit(10);


    // -----------------------------------------
    // Revenue
    // -----------------------------------------

    const revenue =
      totalRevenue.length > 0
        ? totalRevenue[0].total
        : 0;


    // -----------------------------------------
    // Response
    // -----------------------------------------

    return success(
      res,
      {
        role: user.role,

        cards: {
          totalLeads,

          newLeads,

          activeLeads:
            totalLeads - newLeads,

          interestedLeads,

          readyForPaymentLeads,

          enrolledLeads,

          callsToday,

          followUpsToday,

          overdueFollowUps,

          activeEmployees:
            isDirectAgent ||
            isTeamLead
              ? undefined
              : activeEmployees,

          resignedEmployees:
            isDirectAgent ||
            isTeamLead
              ? undefined
              : resignedEmployees,

          revenue
        },

        recentActivities

      },
      'Dashboard summary retrieved',
      200
    );

  } catch (err) {
    next(err);
  }
};


/**
 * Get dashboard charts
 * GET /api/dashboard/charts
 */
const getDashboardCharts = async (
  req,
  res,
  next
) => {
  try {

    const user = req.user;


    if (!user || !user._id) {
      return res.status(401).json({
        success: false,
        message:
          'Authentication required'
      });
    }


    const isDirectAgent = [
      ROLES.EMPLOYEE,
      ROLES.TELECALLER,
      ROLES.BDE
    ].includes(user.role);


    // -----------------------------------------
    // Lead filter
    // -----------------------------------------

    const leadMatch = {
      isDeleted: false
    };


    if (isDirectAgent) {
      leadMatch.assignedTo =
        user._id;
    }


    // -----------------------------------------
    // 1. Leads by State
    // -----------------------------------------

    const leadsByState =
      await Lead.aggregate([

        {
          $match:
            leadMatch
        },

        {
          $group: {
            _id: {
              $ifNull: [
                '$state',
                'Unspecified'
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
        },

        {
          $limit: 10
        }
      ]);


    // -----------------------------------------
    // 2. Leads by Status
    // -----------------------------------------

    const leadsByStatus =
      await Lead.aggregate([

        {
          $match:
            leadMatch
        },

        {
          $group: {
            _id:
              '$currentStatus',

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
      ]);


    // -----------------------------------------
    // 3. Leads by Source
    // -----------------------------------------

    const leadsBySource =
      await Lead.aggregate([

        {
          $match:
            leadMatch
        },

        {
          $group: {
            _id:
              '$source',

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
      ]);


    // -----------------------------------------
    // 4. Calls last 7 days
    // -----------------------------------------

    const sevenDaysAgo =
      new Date();

    sevenDaysAgo.setDate(
      sevenDaysAgo.getDate() - 7
    );

    sevenDaysAgo.setHours(
      0,
      0,
      0,
      0
    );


    const callMatch = {
      createdAt: {
        $gte: sevenDaysAgo
      }
    };


    if (isDirectAgent) {
      callMatch.employeeId =
        user._id;
    }


    const callsByDay =
      await CallHistory.aggregate([

        {
          $match:
            callMatch
        },

        {
          $group: {

            _id: {
              $dateToString: {
                format:
                  '%Y-%m-%d',

                date:
                  '$createdAt'
              }
            },

            calls: {
              $sum: 1
            }
          }
        },

        {
          $sort: {
            _id: 1
          }
        }
      ]);


    // -----------------------------------------
    // 5. Employee performance
    // -----------------------------------------

    let employeePerformance = [];


    if (!isDirectAgent) {

      employeePerformance =
        await CallHistory.aggregate([

          {
            $match: {
              createdAt: {
                $gte:
                  sevenDaysAgo
              }
            }
          },

          {
            $group: {

              _id:
                '$employeeNameSnapshot',

              calls: {
                $sum: 1
              }
            }
          },

          {
            $sort: {
              calls: -1
            }
          },

          {
            $limit: 5
          }
        ]);
    }


    // -----------------------------------------
    // Response
    // -----------------------------------------

    return success(
      res,
      {

        leadsByState:
          leadsByState.map(
            item => ({
              state:
                item._id ||
                'Unknown',

              count:
                item.count
            })
          ),

        leadsByStatus:
          leadsByStatus.map(
            item => ({
              status:
                item._id ||
                'Unknown',

              count:
                item.count
            })
          ),

        leadsBySource:
          leadsBySource.map(
            item => ({
              source:
                item._id ||
                'Unknown',

              count:
                item.count
            })
          ),

        callsTrend:
          callsByDay.map(
            item => ({
              date:
                item._id,

              calls:
                item.calls
            })
          ),

        employeePerformance:
          employeePerformance.map(
            item => ({
              name:
                item._id ||
                'Unknown',

              calls:
                item.calls
            })
          )
      },

      'Chart data retrieved',
      200
    );

  } catch (err) {
    next(err);
  }
};


module.exports = {
  getDashboardSummary,
  getDashboardCharts
};