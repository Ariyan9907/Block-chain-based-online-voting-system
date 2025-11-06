/**
 * Password Migration Script
 * 
 * This script hashes all existing plain text passwords in the voters table
 * and updates them with bcrypt hashed versions.
 * 
 * IMPORTANT: Run this ONCE after implementing password hashing.
 * 
 * Usage: node migrate_passwords.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const SALT_ROUNDS = 10;

async function migratePasswords() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DB || 'voter_db'
    });
    
    console.log('✅ Connected to MySQL database\n');
    console.log('🔄 Starting password migration...\n');
    console.log('='.repeat(70));
    
    // Fetch all voters
    const [voters] = await connection.execute('SELECT voter_id, password FROM voters');
    
    console.log(`📊 Found ${voters.length} voters in database\n`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each voter
    for (const voter of voters) {
      try {
        // Check if password is already hashed (bcrypt hashes start with $2b$)
        if (voter.password && voter.password.startsWith('$2b$')) {
          console.log(`⏭️  Skipping ${voter.voter_id}: Already hashed`);
          skippedCount++;
          continue;
        }
        
        // Hash the plain text password
        const hashedPassword = await bcrypt.hash(voter.password, SALT_ROUNDS);
        
        // Update the database
        await connection.execute(
          'UPDATE voters SET password = ? WHERE voter_id = ?',
          [hashedPassword, voter.voter_id]
        );
        
        console.log(`✅ Migrated ${voter.voter_id}: Password hashed successfully`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Error migrating ${voter.voter_id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('\n📈 MIGRATION SUMMARY:');
    console.log(`   Total voters: ${voters.length}`);
    console.log(`   ✅ Migrated: ${migratedCount}`);
    console.log(`   ⏭️  Skipped (already hashed): ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('\n' + '='.repeat(70));
    
    if (migratedCount > 0) {
      console.log('\n🎉 Password migration completed successfully!');
      console.log('💡 All new registrations will use hashed passwords automatically.\n');
    } else if (skippedCount === voters.length) {
      console.log('\n✅ All passwords are already hashed. No migration needed.\n');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed.\n');
    }
  }
}

// Run the migration
console.log('\n' + '='.repeat(70));
console.log('           PASSWORD MIGRATION TOOL');
console.log('='.repeat(70) + '\n');
console.log('⚠️  WARNING: This will hash all plain text passwords in the database.');
console.log('⚠️  Make sure you have a database backup before proceeding!\n');

// Start migration
migratePasswords().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
