# Current Product Requirements

> Current requirements baseline for 2026-08-07. This complements the historical `REQUIREMENTS.md`; it does not silently rewrite historical decisions.

## Product definition

رویش is a Persian RTL cultural, تربیتی, and family platform for حوزه families. The current implementation provides a learning-platform core. The next product slice must turn the family/cultural identity into real persisted workflows rather than static dashboard presentation.

## Current implemented requirements

- Users can sign in with numeric center ID, national ID, and password.
- Users can recover a password through numeric center ID, national ID, and mobile one-time code.
- Authenticated users receive role-aware access.
- Tenant-scoped users can browse courses and lessons.
- Users can enroll in published courses and record lesson completion.
- Administrators can create/publish courses and add lessons.
- The application provides Persian RTL and dark-mode web experiences.
- Health, readiness, and metrics endpoints exist.

## Next family-domain requirements

### Family identity

- A family belongs to one tenant/center.
- A family has one or more members.
- Each member has a relationship to the family and an age-appropriate profile.
- Parent/guardian access must not expose unrelated families or children.
- Children/minor data must have explicit access and privacy rules.

### Cultural participation

- Authorized admins can create campaigns, competitions, events, trips, and تربیتی content.
- A family member can view eligible activities.
- A family/member can register or submit participation where applicable.
- The system records participation status and timestamps.
- Announcements shown on the dashboard come from persisted tenant-scoped data.

### Dashboard truthfulness

- Counts and labels on the dashboard must come from APIs/database queries.
- Empty states must be honest when the tenant has no activities.
- Demonstration fixtures must be explicitly labeled as demo data.

### Product safety

- National ID, mobile, family relationships, and minor data must not appear in logs.
- Tenant isolation must be tested across every family-domain query.
- Parent/child authorization must be covered by integration tests before release.

## Explicitly not implemented until verified

- Public registration
- Parent role and delegated child access
- Family data model
- Campaigns, competitions, trips, events, and participation APIs
- Durable notification center
- Production object storage and media streaming
- Learning paths and advanced reporting
