// scripts/seed-production-test.js - Create user/course/enrollment for prod certificate test
const path = require('path');
const pg = require(path.join(__dirname, '../node_modules/.pnpm/pg@8.22.0/node_modules/pg'));
const { randomUUID } = require('crypto');

const url = process.env.DATABASE_URL || '';

async function main() {
  const client = new pg.Client({ connectionString: url });
  await client.connect();

  const tenantId = 'e1f64013-e503-497f-8c3e-7ddcde241885';
  const userId = randomUUID();
  const courseId = randomUUID();
  const enrollmentId = randomUUID();

  // User
  await client.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, display_name, role, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
    [userId, tenantId, `student-${userId.slice(0,8)}@test.dev`, 'x', 'Test Student', 'student', true]
  );

  // Course
  await client.query(
    `INSERT INTO courses (id, tenant_id, title, description, status, created_by) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
    [courseId, tenantId, 'Test Certificate Course', 'A test course for certificate issuance', 'published', userId]
  );

  // Completed enrollment
  await client.query(
    `INSERT INTO enrollments (id, tenant_id, user_id, course_id, status, enrolled_at, completed_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) ON CONFLICT (id) DO NOTHING`,
    [enrollmentId, tenantId, userId, courseId, 'completed']
  );

  console.log(JSON.stringify({ userId, courseId, enrollmentId, tenantId }, null, 2));
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
