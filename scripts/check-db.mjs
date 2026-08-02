// scripts/check-db.js - use migrate.ts pattern
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Resolve pg from packages/core
const pgPath = resolve(__dirname, '../packages/core/node_modules/pg');
const pg = await import(pgPath);

const url = process.env.DATABASE_URL || '';

async function main() {
  const client = new pg.Client({ connectionString: url });
  await client.connect();

  const tables = await client.query('SELECT tablename FROM pg_tables WHERE schemaname = \'public\' ORDER BY tablename');
  console.log('Tables:', tables.rows.map(r => r.tablename).join(', '));

  const completed = await client.query("SELECT id, status, tenant_id, user_id, course_id FROM enrollments WHERE status = 'completed' LIMIT 10");
  console.log('Completed enrollments count:', completed.rowCount);
  console.log(JSON.stringify(completed.rows, null, 2));

  const allEnr = await client.query('SELECT id, status, tenant_id, user_id, course_id FROM enrollments LIMIT 10');
  console.log('All enrollments count:', allEnr.rowCount);
  console.log(JSON.stringify(allEnr.rows, null, 2));

  const courses = await client.query('SELECT id, title, status, tenant_id FROM courses LIMIT 5');
  console.log('Courses:', JSON.stringify(courses.rows, null, 2));

  const users = await client.query('SELECT id, email, role, tenant_id FROM users LIMIT 5');
  console.log('Users:', JSON.stringify(users.rows, null, 2));

  const tenants = await client.query('SELECT id, name FROM tenants LIMIT 5');
  console.log('Tenants:', JSON.stringify(tenants.rows, null, 2));

  const certCols = await client.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'certificates\'');
  console.log('Certificates columns:', certCols.rows.map(r => r.column_name));

  await client.end();
}

main().catch(e => {
  console.error('ERR', e.message);
  process.exit(1);
});
