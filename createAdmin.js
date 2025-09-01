// This script will DELETE ALL USERS and then create a single new superuser.
require('dotenv').config();
const db = require('./src/models');
const bcrypt = require('bcryptjs');

const User = db.User;
const UserProfile = db.UserProfile;
const Car = db.Car;
const ActivityLog = db.ActivityLog;

async function resetAndCreateAdmin() {
  try {
    await db.sequelize.sync();
    console.log("✅ Database connected.");

    // Un-link all cars from their owners first
    console.log("🔄 Un-linking all cars from their owners...");
    const [updatedCarsCount] = await Car.update(
      { owner_id: null },
      { where: {} }
    );
    console.log(`✅ Successfully un-linked ${updatedCarsCount} cars.`);

    // Clear activity logs
    console.log("🗑️ Deleting all activity logs...");
    await ActivityLog.destroy({ where: {} });

    // Clear user profiles
    console.log("🗑️ Deleting all user profiles...");
    await UserProfile.destroy({ where: {} });

    // Delete all existing users
    console.log("🗑️ Deleting all existing users...");
    const deletedUsersCount = await User.destroy({ where: {} });
    console.log(`✅ Successfully deleted ${deletedUsersCount} users.`);

    // --- Define the new superuser's details ---
    const adminUsername = 'admin';
    const adminPassword = 'admin'; // <-- CHANGE THIS BEFORE DEPLOY 🚨

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminUser = await User.create({
      username: adminUsername,
      email: `${adminUsername}@chartered.auto`,
      password: hashedPassword,
      first_name: '',  // Required fields, set empty
      last_name: '',
      is_superuser: true,
      is_staff: true,
      is_active: true,
      date_joined: new Date(),
    });

    console.log(`✅ New superuser '${adminUser.username}' created successfully!`);

  } catch (error) {
    console.error("❌ An error occurred:", error);
  } finally {
    await db.sequelize.close();
    console.log("🔒 Database connection closed.");
  }
}

resetAndCreateAdmin();
