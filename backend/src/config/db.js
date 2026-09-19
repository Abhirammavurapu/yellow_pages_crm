const mongoose = require('mongoose');
const dns = require('dns');

<<<<<<< HEAD
try {
  // Only use external DNS for SRV / Atlas connections if needed
  if (process.env.MONGODB_URI && process.env.MONGODB_URI.startsWith('mongodb+srv')) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
} catch (e) {
  // Ignore DNS setServer errors
}

let memServer = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/yellow_pages_crm';
  const isLocal = mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost');

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: isLocal ? 2500 : 10000,
=======
dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI is missing in .env');
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
      autoIndex: true
    });

    console.log(
      `[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`
    );
  } catch (error) {
<<<<<<< HEAD
    if (isLocal) {
      console.warn(`[MongoDB] Local MongoDB on 27017 not detected (${error.message}).`);
      console.log(`[MongoDB] Initializing automated In-Memory MongoDB engine...`);

      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        memServer = await MongoMemoryServer.create();
        const memUri = memServer.getUri();

        const conn = await mongoose.connect(memUri, {
          autoIndex: true
        });

        console.log(`[MongoDB] In-Memory Database active and ready at ${conn.connection.host}`);

        // Seed demo accounts if empty
        const Employee = require('../models/Employee');
        const count = await Employee.countDocuments();
        if (count === 0) {
          console.log(`[MongoDB] Seeding initial demo users and CRM sample data...`);
          try {
            const { seedDatabase } = require('../seed/seed');
            await seedDatabase(true);
            console.log(`[MongoDB] Initial demo data seeded successfully.`);
          } catch (e) {
            console.warn(`[MongoDB] Full seed skipped (${e.message}), creating default Super Admin...`);
            const passwordHash = await Employee.hashPassword('ChangeMe123!');
            await Employee.create({
              employeeId: 'ADMIN001',
              name: 'Super Admin',
              email: 'admin@example.com',
              phone: '9876543210',
              passwordHash,
              role: 'SUPER_ADMIN',
              department: 'Administration',
              status: 'ACTIVE'
            });
            console.log(`[MongoDB] Super Admin demo created: admin@example.com / ChangeMe123!`);
          }
        }
        return;
      } catch (memErr) {
        console.error(`[MongoDB] In-memory engine failed to start: ${memErr.message}`);
      }
    }

    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.warn(`[MongoDB] Please ensure MongoDB is running or specify a valid MONGODB_URI in backend/.env`);
=======
    console.error(`[MongoDB] Connection error: ${error.message}`);
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
    process.exit(1);
  }
};

<<<<<<< HEAD
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memServer) {
      await memServer.stop();
      memServer = null;
    }
  } catch (err) {
    // Ignore error on disconnect
  }
};

connectDB.disconnectDB = disconnectDB;

=======
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
module.exports = connectDB;