# Member accounts — one-time setup

Member accounts run on the **same Supabase project and Auth** as the admin
login. Admin access is untouched: `/admin` is still gated by `ADMIN_EMAILS`
and `profiles.role = 'admin'`. Members are ordinary Supabase users with
`role = 'customer'` (the default) and a `username`.

What the code adds:

| Area | Routes / files |
| --- | --- |
| Sign in / up / reset | `/sign-in`, `/sign-up`, `/forgot-password` |
| Member pages (session required) | `/account`, `/account/username`, `/account/password` |
| Link landing (Google + email links) | `/auth/callback` |
| Username availability | `GET /api/account/username?u=` |
| Header | gold "Sign in" → `@username` menu (Account, Sign out) |
| Data | `supabase/accounts.sql` (profiles.username, purchases.user_id) |
| Emails | `supabase/email-templates/*.html` (dark + gold) |

Do the steps below in order. Nothing needs a redeploy except step 5.

---

## 1. Database: run `supabase/accounts.sql`

Supabase dashboard → **SQL Editor** → paste the whole of
[`supabase/accounts.sql`](accounts.sql) → **Run**. It is additive and safe to
re-run. It adds `profiles.username` (unique, case-insensitive),
`purchases.user_id`, a self-read policy on purchases, and teaches the
new-user trigger to copy the username chosen at sign-up.

---

## 2. Google Cloud: an OAuth client

1. [console.cloud.google.com](https://console.cloud.google.com) → pick or
   create a project → **APIs & Services → OAuth consent screen**.
   External, app name "Reza Ohadi", your support email, and add your domain
   under *Authorized domains*. Scopes: the default `email`, `profile`,
   `openid`. Publish the app (otherwise only test users can sign in).
2. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   → type **Web application**.
3. **Authorized JavaScript origins**: your site, e.g. `https://rezaohadi.com`
   (and `http://localhost:3000` for local testing).
4. **Authorized redirect URIs**: exactly one, Supabase's callback:

   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```

   (Find the ref in Supabase → Project Settings → General.)
5. Copy the **Client ID** and **Client secret**.

---

## 3. Supabase: Google provider + URL configuration

1. **Authentication → Providers → Google** → enable → paste the Client ID and
   Client secret → Save.
2. **Authentication → URL Configuration**:
   - **Site URL**: `https://rezaohadi.com` (your production domain, no trailing slash).
   - **Redirect URLs** — add each of these:

     ```
     https://rezaohadi.com/auth/callback
     http://localhost:3000/auth/callback
     https://*.vercel.app/auth/callback        (optional: Vercel preview deploys)
     ```

3. **Authentication → Providers → Email**: keep **Confirm email** ON
   (members must click the link before their first sign-in).
   Optional: set *Minimum password length* to 8 to match the forms.

---

## 4. Supabase: emails from your domain (SMTP) + the dark/gold templates

Store emails (receipts, library links) are sent by the app itself through
Resend, so they already come from your domain. Supabase sends the
**confirmation** and **password reset** emails separately, and out of the box
it uses its own sender with a 2-emails-per-hour limit. Point it at Resend:

1. In Resend, make sure your domain is verified (the same one `EMAIL_FROM`
   uses). Create an API key if you want a dedicated one for Supabase.
2. Supabase → **Project Settings → Authentication → SMTP Settings** →
   enable **Custom SMTP**:

   | Field | Value |
   | --- | --- |
   | Sender email | e.g. `accounts@rezaohadi.com` |
   | Sender name | `Reza Ohadi` |
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | your Resend API key |

   Save, then raise the rate limit under **Authentication → Rate Limits →
   Email** if you like (the default after custom SMTP is 30/hour).
3. **Authentication → Email Templates**:
   - **Confirm signup** → subject `Confirm your email · Reza Ohadi` → body:
     paste [`email-templates/confirm-signup.html`](email-templates/confirm-signup.html).
   - **Reset password** → subject `Reset your password · Reza Ohadi` → body:
     paste [`email-templates/reset-password.html`](email-templates/reset-password.html).

   The templates link to `{{ .RedirectTo }}?token_hash=…&type=…`, which lands
   on `/auth/callback` and signs the member in on any device. (If a template is
   left as the default, the default link still works: it comes back with a
   `code` and the callback handles that too, but only in the same browser.)

---

## 5. Vercel: environment variables

No new variables. Check these existing ones are set for **Production** (and
Preview if you use it):

| Variable | Why it matters here |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Must be the real domain: email links and Stripe return URLs use it. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sign-in forms and the header read the session with these. |
| `SUPABASE_SERVICE_ROLE_KEY` | Username availability/saves, purchase claiming, downloads. |

Then deploy the `accounts` branch (merge to `main` after the end-to-end test).

---

## 6. Local end-to-end test

1. Put the same three Supabase keys in `.env.local` (plus `NEXT_PUBLIC_SITE_URL=http://localhost:3000`).
2. `npm run dev`, then:
   - `/sign-up` → pick a username → confirmation email arrives (dark/gold)
     → click → lands on `/account` signed in.
   - Header shows `@username`; menu has Account / Sign out.
   - `/sign-in` → "Continue with Google" → first time → username step → `/account`.
   - `/forgot-password` → reset email → link → new-password form → `/account`.
   - A guest purchase made earlier with the same email shows on `/account`.
   - `/library` still emails links to guests, unchanged.
   - `/admin/login` still works exactly as before.
