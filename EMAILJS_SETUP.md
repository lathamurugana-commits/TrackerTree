# 📧 Gmail SMTP Setup Guide — OpenSkools Receipt Sender

The receipt email is sent via **Google SMTP** through a **Supabase Edge Function**.  
Your Gmail credentials are stored securely as Supabase secrets — they never touch the browser.

---

## Step 1 — Generate a Gmail App Password

> ⚠️ You need **2-Step Verification** enabled on your Google account first.

1. Go to → https://myaccount.google.com/security
2. Under **"How you sign in to Google"** → click **2-Step Verification** → enable it
3. Go back to Security → scroll down → click **"App passwords"**
   - (or go directly to → https://myaccount.google.com/apppasswords)
4. Select **App**: `Mail` → **Device**: `Other` → type `OpenSkools` → click **Generate**
5. **Copy the 16-character password** shown (e.g. `abcd efgh ijkl mnop`)

---

## Step 2 — Add Secrets to Supabase

Go to your Supabase project → **Settings** → **Edge Functions** → **Secrets**  
(URL: `https://supabase.com/dashboard/project/mfsbeekiiwyyutnuidqc/settings/functions`)

Add these two secrets:

| Secret Name          | Value                                      |
|----------------------|--------------------------------------------|
| `GMAIL_USER`         | Your full Gmail address (e.g. `you@gmail.com`) |
| `GMAIL_APP_PASSWORD` | The 16-char app password from Step 1       |

---

## Step 3 — Deploy the Edge Function

Install Supabase CLI (if not installed):
```powershell
npm install -g supabase
```

Login and link your project:
```powershell
supabase login
supabase link --project-ref mfsbeekiiwyyutnuidqc
```

Deploy the function:
```powershell
supabase functions deploy send-receipt-email
```

✅ That's it! The function is now live.

---

## Step 4 — Clean up (optional)

The `.env` file with EmailJS keys is no longer needed. You can remove those lines.

---

## How it works end-to-end

```
User clicks 📤 Share on Income row
    ↓
"Prepare Receipt" generates PDF → uploads to Supabase storage → public URL
    ↓
[Email button clicked]
    ↓
Frontend calls supabase.functions.invoke('send-receipt-email')
    ↓
Edge Function (Deno) connects to smtp.gmail.com:465 via TLS
    ↓
Sends HTML email with branded "Download Receipt PDF" button
    ↓
Student receives email in inbox ✉️
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Gmail credentials not set` | Check Supabase Secrets — GMAIL_USER and GMAIL_APP_PASSWORD must be set |
| `Authentication failed` | Make sure you used an App Password, not your regular Gmail password |
| `Function not found` | Run `supabase functions deploy send-receipt-email` again |
| `CORS error` | Redeploy the function — the CORS headers are already included |
| Email goes to spam | Add SPF record to your domain, or ask student to mark as "Not Spam" |

---

## Free Tier Notes
- Supabase Edge Functions: **500K invocations/month** free
- Gmail SMTP: **~500 emails/day** free with App Password
- No paid plan required for either 🎉
