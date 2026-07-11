# @hawza/plugin-localization

Cross-cutting localization concerns.

Stateless — no DB tables, no API routes. Owns Persian/RTL formatting helpers,
Shamsi date utilities, and translation lookup. Other plugins call into it
through `@hawza/contracts` and (later) `@hawza/core/api` for the helpers.
