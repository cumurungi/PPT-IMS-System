const { Client } = require('pg');

(async function main() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_OUu6tHTdobz5@ep-delicate-king-au8zx7wp.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Audiobook' ORDER BY ordinal_position`);
    console.log('Audiobook columns:');
    result.rows.forEach(row => console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
})();
