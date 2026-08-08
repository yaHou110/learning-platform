// scripts/create-admin.js - Create admin user with bcrypt hash
const path = require('path');
const pg = require(path.join(__dirname, '../node_modules/.pnpm/pg@8.22.0/node_modules/pg'));
const bcrypt = require(path.join(__dirname, '../node_modules/.pnpm/bcryptjs@2.4.3/node_modules/bcryptjs'));
const { randomUUID } = require('crypto');

const url = process.env.DATABASE_URL || '';

async function main() {
  const hash = await bcrypt.hash('password123', 12);
  const client = new pg.Client({ connectionString: url });
  await client.connect();

  const tenantId = 'e1f64013-e503-497f-8c3e-7ddcde241885';
  const adminId = randomUUID();

  await client.query(
    `INSERT INTO users (id, tenant_id, email, national_id, phone, password_hash, display_name, role, is_active, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
     ON CONFLICT DO NOTHING`,
    [adminId, tenantId, 'admin@test.dev', '1234567891', '09123456789', hash, 'Admin', 'super_admin', true]
  );

  console.log('Admin user created:');
  console.log({ email: 'admin@test.dev', password: 'password123', tenantSlug: 'test-sem' });
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });