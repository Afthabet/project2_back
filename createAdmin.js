// This script safely creates a new superadmin or updates an existing one.
// It will NOT delete any of your existing users or data.
require('dotenv').config();
const db = require('./src/models');
const bcrypt = require('bcryptjs');

const User = db.User;

async function createOrUpdateAdmin() {
  try {
    await db.sequelize.sync();
    console.log("✅ Database connected successfully.");

    // --- Define the superuser's details ---
    // You can change 'admin' to another username if you prefer.
    const adminUsername = 'server';
    const adminPassword = 'server'; // <-- Set a temporary password here.

    // 1. Check if a user with this username already exists
    const existingUser = await User.findOne({ where: { username: adminUsername } });

    if (existingUser) {
      // If the user exists, update them to ensure they are an active superadmin
      console.log(`🟡 User '${adminUsername}' already exists. Re-activating and ensuring superuser status...`);
      
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await existingUser.update({
        is_active: true,
        is_superuser: true,
        is_staff: true,
        password: hashedPassword // Optionally reset the password
      });
      
      console.log(`✅ User '${adminUsername}' has been successfully updated and re-activated.`);

    } else {
      // If the user does not exist, create a new one
      console.log(`⚙️ User '${adminUsername}' not found. Creating a new superuser...`);
      
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const adminUser = await User.create({
        username: adminUsername,
        email: `${adminUsername}@chartered.auto`,
        password: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        is_superuser: true,
        is_staff: true,
        is_active: true,
        date_joined: new Date(),
      });

      console.log(`✅ New superuser '${adminUser.username}' created successfully!`);
    }

  } catch (error) {
    console.error("❌ An error occurred during the script:", error);
  } finally {
    await db.sequelize.close();
    console.log("🔒 Database connection closed.");
  }
}

createOrUpdateAdmin();