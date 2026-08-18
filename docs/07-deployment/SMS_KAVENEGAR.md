# SMS delivery — Kaveh Negar (کاوه‌نگار)

The password-reset flow sends a 6-digit verification code by SMS. Delivery is
abstracted in `apps/web/src/lib/sms.ts` behind `SMS_PROVIDER`:

| `SMS_PROVIDER` | Behaviour |
| --- | --- |
| `mock` (default) | Logs the code to the server console; in non-production it is also echoed in the API response (`devCode`) so the flow is testable end-to-end without a gateway. |
| `kavenegar` | Sends a real SMS via `https://api.kavenegar.com` REST API. Falls back to mock if `KAVENEGAR_API_KEY` is unset. |

## Enabling on a fresh Kaveh Negar account

A new account works with **just the API key** — no sender line needs to be
claimed, because Kaveh Negar sends from the account's default line (خدمات
پیام کوتاه) when the `sender` parameter is omitted.

1. **Get the API key.** Log in at `kavenegar.com` → «API Key» (کلید API) →
   copy the key (a long hex string).
2. **Add credit (شارژ).** Real SMS sends consume account credit; top up in the
   panel before the first send.
3. **Configure the app.** In `apps/web/.env` (or the deployment environment):

   ```dotenv
   SMS_PROVIDER=kavenegar
   KAVENEGAR_API_KEY=<your-key>
   # Optional — omit to use the account's default sender line:
   # KAVENEGAR_SENDER=10004346
   ```

4. **Smoke-test** without touching the app UI:

   ```bash
   cd apps/web
   pnpm sms:test --phone 09123456789
   ```

   It loads `.env`, sends a real SMS through the same endpoint the app uses,
   and exits non-zero (with Kaveh Negar's error message) on failure. With
   `SMS_PROVIDER=mock` it prints what would be sent and does not call the API.

## How the app uses it

- `apps/web/src/app/api/auth/forgot-password/route.ts` generates the code,
  persists it, and calls `sendPasswordResetSms()`. The SMS contains the code
  and its 10-minute validity.
- Sends are rate-limited per phone (anti-SMS-bombing) on top of the IP limit.
- In development with `SMS_PROVIDER=mock`, the code is shown on the
  forgot-password form itself (`devCode`), so the whole reset flow can be
  exercised without spending credit.

## Production notes

- Never commit `KAVENEGAR_API_KEY` — it belongs in the deployment environment
  (`docs/07-deployment/env.template` lists the variable).
- Kaveh Negar returns HTTP 200 even for rejected sends; the app checks the
  JSON `return.status` field (200 = accepted) and logs the provider's message
  on failure. A failed send surfaces to the user as a generic
  "try again later" error.
- The default sender line is fine for transactional codes. If you later claim
  a dedicated line, set `KAVENEGAR_SENDER` to it and the app will use it.
