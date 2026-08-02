// scripts/seed-and-test-cert.js
const path = require('path');
const pg = require(path.join(__dirname, '../node_modules/.pnpm/pg@8.22.0/node_modules/pg'));
const { createHmac, randomUUID } = require('crypto');

const url = process.env.DATABASE_URL || '';
const CERT_SIGNING_SECRET = process.env.CERT_SIGNING_SECRET || '';

async function main() {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  console.log('Connected to DB.');

  // Cleanup any leftover test data first
  await client.query('DELETE FROM certificates');
  await client.query('DELETE FROM enrollments');
  await client.query('DELETE FROM courses');
  await client.query('DELETE FROM users');
  await client.query("DELETE FROM tenants WHERE slug LIKE 'cert-test-%'");
  console.log('Cleanup done.');

  // 1. Create tenant (unique slug)
  const slug = 'cert-test-' + randomUUID().slice(0, 8);
  const tenantRes = await client.query(
    `INSERT INTO tenants (id, slug, name) VALUES (gen_random_uuid(), $1, 'Cert Test Seminary') RETURNING id, slug`,
    [slug]
  );
  const tenant = tenantRes.rows[0];
  console.log('Tenant:', tenant);

  // 2. Create user
  const userRes = await client.query(
    `INSERT INTO users (id, tenant_id, email, display_name, role, password_hash)
     VALUES (gen_random_uuid(), $1, 'admin-cert-test@test.local', 'Admin Test', 'super_admin', 'placeholder')
     RETURNING id, tenant_id, role`,
    [tenant.id]
  );
  const user = userRes.rows[0];
  console.log('User:', user);

  // 3. Create course
  const courseRes = await client.query(
    `INSERT INTO courses (id, tenant_id, title, status, created_by)
     VALUES (gen_random_uuid(), $1, 'Certificate Test Course', 'published', $2)
     RETURNING id, tenant_id, title, status`,
    [tenant.id, user.id]
  );
  const course = courseRes.rows[0];
  console.log('Course:', course);

  // 4. Create enrollment (completed)
  const enrollRes = await client.query(
    `INSERT INTO enrollments (id, tenant_id, user_id, course_id, status)
     VALUES (gen_random_uuid(), $1, $2, $3, 'completed')
     RETURNING id, tenant_id, user_id, course_id, status`,
    [tenant.id, user.id, course.id]
  );
  const enrollment = enrollRes.rows[0];
  console.log('Enrollment:', enrollment);

  // 5. Issue certificate (POST /api/certificates logic)
  const certId = randomUUID();
  const payloadToSign = {
    certificateId: certId,
    userId: enrollment.user_id,
    courseId: enrollment.course_id,
    issueDate: new Date().toISOString(),
    enrollmentId: enrollment.id,
  };

  const hmac = createHmac('sha256', CERT_SIGNING_SECRET);
  hmac.update(JSON.stringify(payloadToSign));
  const signature = hmac.digest('base64');
  console.log('🖋️  Certificate hash (signature):', signature);

  const certRes = await client.query(
    `INSERT INTO certificates (id, tenant_id, user_id, course_id, enrollment_id, certificate_hash, signed_payload, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
     RETURNING id, enrollment_id, certificate_hash, signed_payload, status, issue_date`,
    [
      certId,
      tenant.id,
      enrollment.user_id,
      enrollment.course_id,
      enrollment.id,
      signature,
      JSON.stringify(payloadToSign),
    ]
  );
  const cert = certRes.rows[0];
  console.log('✅ Certificate issued:', JSON.stringify(cert, null, 2));

  // 6. Verify by hash (GET /api/certificates/verify?hash=... logic)
  const verifyRes = await client.query(
    `SELECT id, enrollment_id, certificate_hash, signed_payload, status, issue_date, expiration_date
     FROM certificates WHERE certificate_hash = $1`,
    [signature]
  );

  if (verifyRes.rows.length > 0) {
    const v = verifyRes.rows[0];
    console.log('✅ Verify by hash: FOUND');
    console.log('  Certificate ID:', v.id);
    console.log('  Enrollment ID:', v.enrollment_id);
    console.log('  Status:', v.status);
    console.log('  Issued:', v.issue_date);
    console.log('  Payload:', JSON.stringify(v.signed_payload));
  } else {
    console.log('❌ Verify by hash: NOT FOUND');
    process.exit(1);
  }

  // Cleanup
  await client.query('DELETE FROM certificates');
  await client.query('DELETE FROM enrollments');
  await client.query('DELETE FROM courses');
  await client.query('DELETE FROM users');
  await client.query('DELETE FROM tenants WHERE slug = $1', [slug]);

  await client.end();
  console.log('\n✅ Certificate issuance + verification tests PASSED. Cleanup complete.');
}

main().catch(e => {
  console.error('ERR', e.message);
  console.error(e.stack);
  process.exit(1);
});
