const { Client } = require('pg');

(async function main() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_OUu6tHTdobz5@ep-delicate-king-au8zx7wp.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name ILIKE 'audiobook'`);
    console.log('Audiobook tables:', result.rows);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
})();
