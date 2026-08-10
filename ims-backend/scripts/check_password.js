const bcrypt = require('bcryptjs');
const { Client } = require('pg');

(async function main() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_OUu6tHTdobz5@ep-delicate-king-au8zx7wp.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query(`SELECT id, email, "passwordHash" FROM "User" WHERE email = 'cumurungi9@gmail.com'`);
    if (result.rows.length === 0) {
      console.log('User not found');
      return;
    }
    const user = result.rows[0];
    console.log('User found:', user.email);
    console.log('Password hash starts with:', user.passwordHash.substring(0, 20) + '...');
    
    // Test the password
    const match = await bcrypt.compare('admin123', user.passwordHash);
    console.log('Password "admin123" matches:', match);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
})();
