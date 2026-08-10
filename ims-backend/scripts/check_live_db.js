const { Client } = require('pg');

(async function main() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_OUu6tHTdobz5@ep-delicate-king-au8zx7wp.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Check Audiobook table
    const audiobookCheck = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Audiobook'`);
    console.log('Audiobook table exists:', audiobookCheck.rows.length > 0);

    // Check admin user
    const userCheck = await client.query(`SELECT id, email, role, "isActive" FROM "User" WHERE email = 'cumurungi9@gmail.com'`);
    console.log('Admin user:', userCheck.rows.length > 0 ? userCheck.rows[0] : 'NOT FOUND');

    // Check all users
    const allUsers = await client.query(`SELECT id, email, role, "isActive", department FROM "User" LIMIT 10`);
    console.log('All users in database:', allUsers.rows);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
})();
