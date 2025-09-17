const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');
const { hasPermission } = require('../middleware/permissions');
require('dotenv').config({ path: '../../.env' });

async function debugPermissions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the admin user
    const adminUser = await User.findOne({ email: 'admin@example.com' }).populate('role');
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log(`✅ Admin user: ${adminUser.email}`);
    console.log(`✅ User role type: ${typeof adminUser.role}`);
    console.log(`✅ User role: ${adminUser.role}`);
    console.log(`✅ Role name: ${adminUser.role?.name}`);
    console.log(`✅ Role ID: ${adminUser.role?._id}`);
    console.log(`✅ Role permissions: ${adminUser.role?.permissions?.length} permissions`);
    
    // Test the hasPermission function directly
    console.log('\n🔍 Testing hasPermission function:');
    
    const testPermissions = ['roles.read', 'users.read', 'projects.read'];
    for (const permission of testPermissions) {
      const result = await hasPermission(adminUser.role, permission);
      console.log(`  - hasPermission('${permission}'): ${result ? '✅' : '❌'}`);
    }
    
    // Test with role ID
    console.log('\n🔍 Testing with role ID:');
    for (const permission of testPermissions) {
      const result = await hasPermission(adminUser.role._id, permission);
      console.log(`  - hasPermission('${permission}'): ${result ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.error('❌ Error debugging permissions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the debug function
if (require.main === module) {
  debugPermissions();
}

module.exports = { debugPermissions };

