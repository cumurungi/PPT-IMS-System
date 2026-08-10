const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function generateId() {
  return crypto.randomBytes(12).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').substring(0, 22);
}

(async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to Neon PostgreSQL');

    const email = 'media.manage@ims.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 12);
    const id = generateId();

    const result = await client.query(
      `INSERT INTO "User" (id, email, "passwordHash", name, role, department, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET "passwordHash" = $3, role = $5, department = $6, "isActive" = $7, "updatedAt" = NOW()
       RETURNING id, email, role, department`,
      [id, email, hashedPassword, 'Media Manager', 'MANAGER', 'MEDIA', true]
    );

    console.log('Media manager created/updated:', result.rows[0]);
    console.log('Login with:', email, '/', password);
  } catch (e) {
    console.error('Seed error:', e.message);
  } finally {
    await client.end();
  }
})();
