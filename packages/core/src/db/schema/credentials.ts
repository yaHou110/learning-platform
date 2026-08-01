import { sql } from 'drizzle-orm';
import {
  check,
  pgTable,
  text,
  timestamp,
  index,
  uuid,
  jsonb,
} from 'drizzle-orm/pg-core';
import { tenants, users } from './identity';
import { enrollments } from './learning';
import { courses } from './catalog';

export const certificates = pgTable(
  'certificates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    enrollmentId: uuid('enrollment_id').notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
    issueDate: timestamp('issue_date', { withTimezone: true }).notNull().defaultNow(),
    expirationDate: timestamp('expiration_date', { withTimezone: true }),
    certificateHash: text('certificate_hash').notNull(),
    signedPayload: jsonb('signed_payload').notNull(),
    status: text('status').notNull().default('active'),
  },
  (t) => ({
    tenantUserIdx: index('certificates_tenant_user_idx').on(t.tenantId, t.userId),
    userCourseIdx: index('certificates_user_course_idx').on(t.userId, t.courseId),
    hashIdx: index('certificates_hash_idx').on(t.certificateHash),
    statusCheck: check('certificates_status_check', sql`${t.status} in ('active','revoked')`),
  })
);

export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;