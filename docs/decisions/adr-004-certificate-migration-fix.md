# ADR-004: Certificate Migration Chain Fix

## Status
Proposed

## Context
- Journal migrations فقط `[0000_nosy_kang, 0001_solid_victor_mancha]` دارد
- فایل‌های migration 0002_plugin_catalog و 0003_plugin_learning در HEAD هستند ولی در journal ثبت نشده‌اند
- Production ممکن است از مرحله قبلی (cardano) باشد و جداول catalog/learning نداشته باشد

## Decision
یک migration جدید ایجاد می‌کنیم که:
1. جدول `certificates` را اضافه می‌کند
2. از `IF NOT EXISTS` استفاده می‌کند تا در صورت وجود قبلی از قبل، خطا ندهد
3. Journal را در حالت staged نگه می‌داریم

## Consequences
- اگر جدول certificates قبلاً از طریق migration دستی یا راه دیگر ساخته شده باشد، مهاجرت idempotent خواهد بود
- اگر جداول catalog/learning در production وجود نداشته باشند، برنامه خطا می‌گیرد (FK violation) — این نیاز به بررسی دیتابیس production دارد

## Alternatives Considered
1. حذف catalog/learning از commit — ریسک داشت که production از مرحله قبلی باشد
2. افزودن راه‌اندازی دیتابیس کامل در محلی — Docker در دسترس نبود

## Related Issues
- Migration chain mismatch between HEAD and journal
- Railway proxy certificate fix pending