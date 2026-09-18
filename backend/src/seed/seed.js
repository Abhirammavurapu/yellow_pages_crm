require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Team = require('../models/Team');
const Lead = require('../models/Lead');
const CallHistory = require('../models/CallHistory');
const FollowUp = require('../models/FollowUp');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Listing = require('../models/Listing');
const AuditLog = require('../models/AuditLog');
const Activity = require('../models/Activity');
const { ROLES, EMPLOYEE_STATUS } = require('../config/constants');
const { normalizePhoneNumber } = require('../utils/phoneNormalizer');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/yellow_pages_crm';

async function seedDatabase() {
  try {
    console.log('[Seed] Connecting to MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Connected to database.');

    // Clear existing data
    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      Employee.deleteMany({}),
      Team.deleteMany({}),
      Lead.deleteMany({}),
      CallHistory.deleteMany({}),
      FollowUp.deleteMany({}),
      Payment.deleteMany({}),
      Enrollment.deleteMany({}),
      Listing.deleteMany({}),
      AuditLog.deleteMany({}),
      Activity.deleteMany({})
    ]);

    console.log('[Seed] Creating employees hierarchy...');

    // 1. Super Admin
    const superAdminPassword = await Employee.hashPassword('ChangeMe123!');
    const superAdmin = await Employee.create({
      employeeId: 'EMP001',
      name: 'Super Admin',
      email: 'admin@example.com',
      phone: '9876500001',
      passwordHash: superAdminPassword,
      role: ROLES.SUPER_ADMIN,
      department: 'Executive Management',
      status: EMPLOYEE_STATUS.ACTIVE
    });

    // 2. Admin
    const adminPassword = await Employee.hashPassword('AdminPass123!');
    const admin = await Employee.create({
      employeeId: 'EMP002',
      name: 'Rajesh Sharma',
      email: 'admin.rajesh@example.com',
      phone: '9876500002',
      passwordHash: adminPassword,
      role: ROLES.ADMIN,
      department: 'Sales & Operations',
      managerId: superAdmin._id,
      createdBy: superAdmin._id,
      status: EMPLOYEE_STATUS.ACTIVE
    });

    // 3. HR Admin
    const hrPassword = await Employee.hashPassword('HrPass123!');
    const hrAdmin = await Employee.create({
      employeeId: 'EMP003',
      name: 'Sunita Rao',
      email: 'hr.sunita@example.com',
      phone: '9876500003',
      passwordHash: hrPassword,
      role: ROLES.HR_ADMIN,
      department: 'Human Resources',
      managerId: superAdmin._id,
      createdBy: superAdmin._id,
      status: EMPLOYEE_STATUS.ACTIVE
    });

    // 4. Team Leads
    const tlPassword = await Employee.hashPassword('LeaderPass123!');
    const tl1 = await Employee.create({
      employeeId: 'EMP004',
      name: 'Priya Patel',
      email: 'tl.priya@example.com',
      phone: '9876500004',
      passwordHash: tlPassword,
      role: ROLES.TEAM_LEAD,
      department: 'Inside Sales',
      managerId: admin._id,
      createdBy: admin._id,
      status: EMPLOYEE_STATUS.ACTIVE
    });

    const tl2 = await Employee.create({
      employeeId: 'EMP005',
      name: 'Rahul Varma',
      email: 'tl.rahul@example.com',
      phone: '9876500005',
      passwordHash: tlPassword,
      role: ROLES.TEAM_LEAD,
      department: 'Field BDE',
      managerId: admin._id,
      createdBy: admin._id,
      status: EMPLOYEE_STATUS.ACTIVE
    });

    // 5. Telecallers
    const empPassword = await Employee.hashPassword('AgentPass123!');
    const telecaller1 = await Employee.create({
      employeeId: 'EMP006',
      name: 'Anita Desai',
      email: 'caller.anita@example.com',
      phone: '9876500006',
      passwordHash: empPassword,
      role: ROLES.TELECALLER,
      department: 'Inside Sales',
      managerId: tl1._id,
      createdBy: tl1._id,
      status: EMPLOYEE_STATUS.ACTIVE
    });

    const telecaller2 = await Employee.create({
      employeeId: 'EMP007',
      name: 'Vikram Malhotra',
      email: 'caller.vikram@example.com',
      phone: '9876500007',
      passwordHash: empPassword,
      role: ROLES.TELECALLER,
      department: 'Inside Sales',
      managerId: tl1._id,
      createdBy: tl1._id,
      status: EMPLOYEE_STATUS.ACTIVE
    });

    // 6. BDEs
    const bde1 = await Employee.create({
      employeeId: 'EMP008',
      name: 'Suresh Kumar',
      email: 'bde.suresh@example.com',
      phone: '9876500008',
      passwordHash: empPassword,
      role: ROLES.BDE,
      department: 'Field BDE',
      managerId: tl2._id,
      createdBy: tl2._id,
      status: EMPLOYEE_STATUS.ACTIVE
    });

    const bde2 = await Employee.create({
      employeeId: 'EMP009',
      name: 'Sneha Reddy',
      email: 'bde.sneha@example.com',
      phone: '9876500009',
      passwordHash: empPassword,
      role: ROLES.BDE,
      department: 'Field BDE',
      managerId: tl2._id,
      createdBy: tl2._id,
      status: EMPLOYEE_STATUS.ACTIVE
    });

    // 7. Standard Employees
    const emp1 = await Employee.create({
      employeeId: 'EMP010',
      name: 'Karthik Nair',
      email: 'emp.karthik@example.com',
      phone: '9876500010',
      passwordHash: empPassword,
      role: ROLES.EMPLOYEE,
      department: 'General Sales',
      managerId: tl1._id,
      createdBy: tl1._id,
      status: EMPLOYEE_STATUS.ACTIVE
    });

    const emp2 = await Employee.create({
      employeeId: 'EMP011',
      name: 'Deepak Joshi',
      email: 'emp.deepak@example.com',
      phone: '9876500011',
      passwordHash: empPassword,
      role: ROLES.EMPLOYEE,
      department: 'General Sales',
      managerId: tl1._id,
      createdBy: tl1._id,
      status: EMPLOYEE_STATUS.ACTIVE
    });

    // 8. One Resigned Employee (to demonstrate history preservation)
    const empResigned = await Employee.create({
      employeeId: 'EMP012',
      name: 'Rohan Mehta (Resigned)',
      email: 'rohan.resigned@example.com',
      phone: '9876500012',
      passwordHash: empPassword,
      role: ROLES.TELECALLER,
      department: 'Inside Sales',
      managerId: tl1._id,
      createdBy: admin._id,
      status: EMPLOYEE_STATUS.RESIGNED,
      resignationDate: new Date('2026-08-15'),
      deactivatedDate: new Date('2026-08-15')
    });

    // Create Teams
    console.log('[Seed] Creating Teams...');
    const team1 = await Team.create({
      name: 'Telecalling Alpha Team',
      department: 'Inside Sales',
      teamLeadId: tl1._id,
      members: [telecaller1._id, telecaller2._id, emp1._id, emp2._id],
      createdBy: admin._id
    });

    const team2 = await Team.create({
      name: 'BDE Field Force South',
      department: 'Field BDE',
      teamLeadId: tl2._id,
      members: [bde1._id, bde2._id],
      createdBy: admin._id
    });

    // Link team IDs
    await Employee.updateMany({ _id: { $in: [telecaller1._id, telecaller2._id, emp1._id, emp2._id, tl1._id] } }, { $set: { teamId: team1._id } });
    await Employee.updateMany({ _id: { $in: [bde1._id, bde2._id, tl2._id] } }, { $set: { teamId: team2._id } });

    console.log('[Seed] Creating Leads across Indian States...');

    const sampleLeadsData = [
      {
        leadId: 'YP-10001-2384',
        businessName: 'Royal Spice Multi-Cuisine Restaurant',
        ownerName: 'Manish Agarwal',
        phoneNumbers: ['9848011223'],
        alternatePhoneNumbers: ['9848011224'],
        email: 'info@royalspicerestaurant.com',
        website: 'https://royalspicerestaurant.com',
        category: 'Restaurants & Food',
        address: 'Plot 45, Hitec City Main Road',
        city: 'Hyderabad',
        district: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081',
        source: 'YELLOW_PAGES',
        priority: 'HIGH',
        currentStatus: 'INTERESTED',
        assignedTo: telecaller1._id,
        assignedTeam: team1._id,
        assignedBy: tl1._id,
        assignmentDate: new Date()
      },
      {
        leadId: 'YP-10002-8812',
        businessName: 'Apollo Dental Clinic & Implant Center',
        ownerName: 'Dr. Srinivas Reddy',
        phoneNumbers: ['9849033445'],
        email: 'dr.srinivas@apollodental.in',
        category: 'Healthcare & Hospitals',
        address: 'Road No. 12, Banjara Hills',
        city: 'Hyderabad',
        district: 'Hyderabad',
        state: 'Telangana',
        pincode: '500034',
        source: 'WEBSITE',
        priority: 'URGENT',
        currentStatus: 'READY_FOR_PAYMENT',
        assignedTo: telecaller1._id,
        assignedTeam: team1._id,
        assignedBy: tl1._id,
        assignmentDate: new Date()
      },
      {
        leadId: 'YP-10003-4921',
        businessName: 'Apex Cloud Solutions Pvt Ltd',
        ownerName: 'Sanjay Deshmukh',
        phoneNumbers: ['9822055667'],
        email: 'contact@apexcloudsolutions.com',
        category: 'IT & Software',
        address: 'Phase 1, Hinjawadi Tech Park',
        city: 'Pune',
        district: 'Pune',
        state: 'Maharashtra',
        pincode: '411057',
        source: 'EXCEL',
        priority: 'MEDIUM',
        currentStatus: 'CALL_ME_LATER',
        assignedTo: telecaller2._id,
        assignedTeam: team1._id,
        assignedBy: tl1._id,
        assignmentDate: new Date()
      },
      {
        leadId: 'YP-10004-7123',
        businessName: 'Grand Chola Silk Sarees',
        ownerName: 'S. Ramanathan',
        phoneNumbers: ['9840012345'],
        email: 'info@grandcholasilks.com',
        category: 'Apparel & Retail',
        address: 'Usman Road, T. Nagar',
        city: 'Chennai',
        district: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600017',
        source: 'YELLOW_PAGES',
        priority: 'HIGH',
        currentStatus: 'PAYMENT_COMPLETED',
        assignedTo: bde1._id,
        assignedTeam: team2._id,
        assignedBy: tl2._id,
        assignmentDate: new Date()
      },
      {
        leadId: 'YP-10005-3914',
        businessName: 'Prestige Fitness & Gym',
        ownerName: 'Vikram Singh',
        phoneNumbers: ['9810056789'],
        email: 'prestigefit@gmail.com',
        category: 'Fitness & Sports',
        address: 'C-Block, Greater Kailash 1',
        city: 'New Delhi',
        district: 'South Delhi',
        state: 'Delhi',
        pincode: '110048',
        source: 'SOCIAL_MEDIA',
        priority: 'LOW',
        currentStatus: 'NEW',
        assignedTo: telecaller2._id,
        assignedTeam: team1._id,
        assignedBy: tl1._id,
        assignmentDate: new Date()
      },
      {
        leadId: 'YP-10006-9923',
        businessName: 'Koramangala Pet Care Hospital',
        ownerName: 'Dr. Ananya Gowda',
        phoneNumbers: ['9845012399'],
        email: 'info@koramangalapets.com',
        category: 'Veterinary & Pet Care',
        address: '5th Block, Koramangala',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        pincode: '560095',
        source: 'BULK_IMPORT',
        priority: 'MEDIUM',
        currentStatus: 'FOLLOW_UP_REQUIRED',
        assignedTo: emp1._id,
        assignedTeam: team1._id,
        assignedBy: tl1._id,
        assignmentDate: new Date()
      },
      {
        leadId: 'YP-10007-1522',
        businessName: 'Sri Sai Motors Car Service',
        ownerName: 'G. Venkateshwarlu',
        phoneNumbers: ['9949012345'],
        email: 'srisaimotors.hyd@gmail.com',
        category: 'Automobiles & Services',
        address: 'Near Pillar 140, Attapur',
        city: 'Hyderabad',
        district: 'Rangareddy',
        state: 'Telangana',
        pincode: '500048',
        source: 'YELLOW_PAGES',
        priority: 'URGENT',
        currentStatus: 'INTERESTED',
        assignedTo: telecaller1._id,
        assignedTeam: team1._id,
        assignedBy: tl1._id,
        assignmentDate: new Date()
      },
      {
        leadId: 'YP-10008-8834',
        businessName: 'Coastal Flavours Seafood Kitchen',
        ownerName: 'Thomas Kurien',
        phoneNumbers: ['9847098765'],
        email: 'coastalflavourskochi@gmail.com',
        category: 'Restaurants & Food',
        address: 'Marine Drive',
        city: 'Kochi',
        district: 'Ernakulam',
        state: 'Kerala',
        pincode: '682031',
        source: 'WEBSITE',
        priority: 'MEDIUM',
        currentStatus: 'NEW',
        assignedTo: null, // Unassigned lead for testing allocation
        assignmentDate: null
      }
    ];

    const createdLeads = await Lead.insertMany(sampleLeadsData);
    console.log(`[Seed] Created ${createdLeads.length} sample leads.`);

    // Create Sample Call History
    console.log('[Seed] Creating Sample Calls...');
    const lead1 = createdLeads[0];
    const lead2 = createdLeads[1];

    const call1 = await CallHistory.create({
      leadId: lead1._id,
      employeeId: telecaller1._id,
      employeeNameSnapshot: telecaller1.name,
      employeeRoleSnapshot: telecaller1.role,
      phoneNumber: lead1.phoneNumbers[0],
      callStatus: 'INTERESTED',
      duration: 245,
      notes: 'Customer is very interested in Yellow Pages Premium Gold listing. Requested pricing package by tomorrow morning.',
      followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // Historical call made by the resigned employee to verify historical immutability
    const historicalCall = await CallHistory.create({
      leadId: lead1._id,
      employeeId: empResigned._id,
      employeeNameSnapshot: empResigned.name,
      employeeRoleSnapshot: empResigned.role,
      phoneNumber: lead1.phoneNumbers[0],
      callStatus: 'CALL_ME_LATER',
      duration: 60,
      notes: 'Initial cold call made back in August. Requested callback in September.',
      createdAt: new Date('2026-08-10')
    });

    // Create Follow-ups
    console.log('[Seed] Creating Follow-ups...');
    const today = new Date();
    today.setHours(14, 0, 0, 0);

    const followUpToday = await FollowUp.create({
      leadId: lead1._id,
      assignedTo: telecaller1._id,
      createdBy: telecaller1._id,
      createdByNameSnapshot: telecaller1.name,
      followUpDate: today,
      followUpTime: '02:00 PM',
      notes: 'Send gold banner catalog and explain search boost feature.',
      status: 'PENDING'
    });

    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 2);
    const followUpOverdue = await FollowUp.create({
      leadId: lead2._id,
      assignedTo: telecaller1._id,
      createdBy: telecaller1._id,
      createdByNameSnapshot: telecaller1.name,
      followUpDate: overdueDate,
      followUpTime: '11:00 AM',
      notes: 'Payment link was sent. Verify transaction status.',
      status: 'PENDING'
    });

    // Create Sample Payment & Enrollment for Grand Chola
    const enrolledLead = createdLeads[3];
    const payment = await Payment.create({
      leadId: enrolledLead._id,
      amount: 15000,
      paymentStatus: 'COMPLETED',
      paymentMethod: 'UPI',
      transactionReference: 'UPI/20260918/984001',
      collectedBy: bde1._id,
      collectedByName: bde1.name,
      notes: 'Annual Platinum Listing Membership paid in full.'
    });

    const enrollment = await Enrollment.create({
      leadId: enrolledLead._id,
      enrollmentStatus: 'ACTIVE',
      plan: 'PLATINUM',
      listingStatus: 'ACTIVE',
      enrolledBy: bde1._id
    });

    const listing = await Listing.create({
      leadId: enrolledLead._id,
      businessName: enrolledLead.businessName,
      category: enrolledLead.category,
      description: 'Authentic pure silk Kanchipuram and bridal sarees with doorstep delivery across India.',
      phone: enrolledLead.phoneNumbers[0],
      email: enrolledLead.email,
      address: enrolledLead.address,
      city: enrolledLead.city,
      district: enrolledLead.district,
      state: enrolledLead.state,
      pincode: enrolledLead.pincode,
      listingStatus: 'ACTIVE',
      views: 1420,
      inquiries: 58
    });

    // Create Activities
    await Activity.create({
      actor: superAdmin._id,
      actorName: superAdmin.name,
      actorRole: superAdmin.role,
      action: 'SYSTEM_INITIALIZED',
      entityType: 'SYSTEM',
      entityId: superAdmin._id,
      newValue: { message: 'Yellow Pages CRM database seeded with initial records' }
    });

    console.log('\n=============================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY');
    console.log('=============================================');
    console.log('DEMO ACCOUNTS CREATED:');
    console.log('1. Super Admin: admin@example.com         | Password: ChangeMe123!');
    console.log('2. Admin:       admin.rajesh@example.com  | Password: AdminPass123!');
    console.log('3. HR Admin:    hr.sunita@example.com     | Password: HrPass123!');
    console.log('4. Team Lead:   tl.priya@example.com      | Password: LeaderPass123!');
    console.log('5. Telecaller:  caller.anita@example.com  | Password: AgentPass123!');
    console.log('6. BDE:         bde.suresh@example.com    | Password: AgentPass123!');
    console.log('---------------------------------------------');
    console.log('⚠️  IMPORTANT: Demo passwords must be changed in production.');
    console.log('=============================================\n');

    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error during database seeding:', err);
    process.exit(1);
  }
}

seedDatabase();
