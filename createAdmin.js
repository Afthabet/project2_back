// This script will DELETE ALL USERS and then create a single new superuser.
const db = require('./src/models');
const bcrypt = require('bcryptjs');

const User = db.User;
const Car = db.Car;

async function resetAndCreateAdmin() {
  try {
    await db.sequelize.sync();
    console.log("Database connected.");

    // Un-link all cars from their owners first
    console.log("Un-linking all cars from their owners...");
    const [updatedCarsCount] = await Car.update({ owner_id: null }, { where: {} });
    console.log(`✅ Successfully un-linked ${updatedCarsCount} cars.`);

    // Delete all existing users
    console.log("Deleting all existing users...");
    const deletedUsersCount = await User.destroy({ where: {}, truncate: false });
    console.log(`✅ Successfully deleted ${deletedUsersCount} users.`);

    // --- Define the new superuser's details ---
    const adminUsername = 'admin';
    const adminPassword = 'admin'; // <-- SET YOUR NEW PASSWORD

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminUser = {
      username: adminUsername,
      email: `${adminUsername}@chartered.auto`,
      password: hashedPassword,
      first_name: '', // <-- FIX: Add empty string for first_name
      last_name: '',  // <-- FIX: Add empty string for last_name
      is_superuser: true,
      is_staff: true,
      is_active: true,
      date_joined: new Date(),
    };

    await User.create(adminUser);

    console.log(`✅ New superuser '${adminUsername}' created successfully!`);

  } catch (error) {
    console.error("❌ An error occurred:", error);
  } finally {
    await db.sequelize.close();
    console.log("Database connection closed.");
  }
}

resetAndCreateAdmin();