# @learning-platform/plugin-localization

Cross-cutting localization concerns.

Stateless — no DB tables, no API routes. Owns Persian/RTL formatting helpers,
Shamsi date utilities, and translation lookup. Other plugins call into it
through `@learning-platform/contracts` and (later) `@learning-platform/core/api` for the helpers.
