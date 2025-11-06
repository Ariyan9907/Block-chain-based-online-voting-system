#!/usr/bin/env node
require('dotenv').config();
const db = require('../db');
const bcrypt = require('bcrypt');

// Simple CLI: node scripts/create_admin.js <voter_id> <full_name> <password>
const args = process.argv.slice(2);

if (args.length < 3) {
  console.log('Usage: node scripts/create_admin.js <voter_id> <full_name> <password>');
  process.exit(1);
}

const [voter_id, full_name, password] = args;

async function createAdmin() {
  try {
    const hashed = await bcrypt.hash(password, 10);

    const query = 'INSERT INTO voters (voter_id, full_name, role, password, mobile_number) VALUES (?, ?, ?, ?, ?)';
    const values = [voter_id, full_name, 'admin', hashed, null];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error inserting admin into database:', err.message || err);
        process.exit(2);
      }
      console.log(`Admin account created. Voter ID: ${voter_id}`);
      db.end();
      process.exit(0);
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(3);
  }
}

createAdmin();
