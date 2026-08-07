import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      to_email,
      to_name,
      receipt_no,
      student_name,
      course,
      category,
      payment_mode,
      amount,
      date,
      transaction_id,
      pdf_url,
    } = await req.json();

    // Validate required fields
    if (!to_email || !pdf_url) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing to_email or pdf_url" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const gmailUser        = Deno.env.get("GMAIL_USER") ?? "";
    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD") ?? "";

    if (!gmailUser || !gmailAppPassword) {
      return new Response(
        JSON.stringify({ success: false, error: "Gmail credentials not set in Supabase secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build HTML email body — no trailing spaces to avoid quoted-printable =20 encoding
    const htmlBody = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>',
      '<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">',
      '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">',
      '<tr><td align="center">',
      '<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">',

      // Header
      '<tr>',
      '<td style="background:linear-gradient(135deg,#0077b6,#008AD1);padding:32px 36px;">',
      '<h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">OpenSkools</h1>',
      '<p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Finance &amp; Fee Management</p>',
      '</td></tr>',

      // Receipt Title
      '<tr>',
      '<td style="padding:32px 36px 0;">',
      '<h2 style="margin:0;font-size:20px;color:#0f172a;">Payment Receipt</h2>',
      `<p style="margin:8px 0 0;color:#64748b;font-size:14px;">Dear <strong>${to_name || student_name || "Student"}</strong>, your payment has been received successfully.</p>`,
      '</td></tr>',

      // Details Table
      '<tr>',
      '<td style="padding:24px 36px;">',
      '<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;font-size:13px;">',

      '<tr style="background:#f8fafc;">',
      '<td style="padding:11px 16px;font-weight:600;color:#475569;width:40%;border-bottom:1px solid #e2e8f0;">Receipt No</td>',
      `<td style="padding:11px 16px;color:#0f172a;border-bottom:1px solid #e2e8f0;font-family:monospace;font-weight:600;">${receipt_no}</td>`,
      '</tr>',

      '<tr>',
      '<td style="padding:11px 16px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0;">Date</td>',
      `<td style="padding:11px 16px;color:#0f172a;border-bottom:1px solid #e2e8f0;">${date}</td>`,
      '</tr>',

      '<tr style="background:#f8fafc;">',
      '<td style="padding:11px 16px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0;">Student Name</td>',
      `<td style="padding:11px 16px;color:#0f172a;border-bottom:1px solid #e2e8f0;">${student_name || "N/A"}</td>`,
      '</tr>',

      '<tr>',
      '<td style="padding:11px 16px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0;">Course</td>',
      `<td style="padding:11px 16px;color:#0f172a;border-bottom:1px solid #e2e8f0;">${course || "N/A"}</td>`,
      '</tr>',

      '<tr style="background:#f8fafc;">',
      '<td style="padding:11px 16px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0;">Category</td>',
      `<td style="padding:11px 16px;color:#0f172a;border-bottom:1px solid #e2e8f0;">${category || "N/A"}</td>`,
      '</tr>',

      '<tr>',
      '<td style="padding:11px 16px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0;">Payment Mode</td>',
      `<td style="padding:11px 16px;color:#0f172a;border-bottom:1px solid #e2e8f0;">${payment_mode || "N/A"}</td>`,
      '</tr>',

      ...(transaction_id && transaction_id !== "N/A" ? [
        '<tr style="background:#f8fafc;">',
        '<td style="padding:11px 16px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0;">Transaction ID</td>',
        `<td style="padding:11px 16px;color:#0f172a;border-bottom:1px solid #e2e8f0;font-family:monospace;">${transaction_id}</td>`,
        '</tr>',
      ] : []),

      '<tr style="background:#ecfdf5;">',
      '<td style="padding:14px 16px;font-weight:700;color:#166534;font-size:15px;">Amount Paid</td>',
      `<td style="padding:14px 16px;font-weight:700;color:#16a34a;font-size:17px;">${amount}</td>`,
      '</tr>',

      '</table>',
      '</td></tr>',

      // Download Button
      '<tr>',
      '<td style="padding:0 36px 32px;text-align:center;">',
      `<a href="${pdf_url}" style="display:inline-block;background:#008AD1;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.2px;box-shadow:0 4px 14px rgba(0,138,209,0.35);">Download Receipt PDF</a>`,
      '<p style="margin:12px 0 0;color:#94a3b8;font-size:11px;">Click the button above to download your official PDF receipt.</p>',
      '</td></tr>',

      // Footer
      '<tr>',
      '<td style="background:#f8fafc;padding:20px 36px;border-top:1px solid #e2e8f0;">',
      '<p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">',
      'This is an automatically generated receipt from <strong>OpenSkools Finance Manager</strong>.<br>',
      'For queries: <a href="mailto:contact@openskools.com" style="color:#008AD1;">contact@openskools.com</a>',
      '</p>',
      '</td></tr>',

      '</table>',
      '</td></tr>',
      '</table>',
      '</body>',
      '</html>',
    ].join('\n');

    // Connect to Gmail SMTP and send
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: gmailUser,
          password: gmailAppPassword,
        },
      },
    });

    await client.send({
      from:    `OpenSkools Finance <${gmailUser}>`,
      to:      to_email,
      subject: `Payment Receipt - ${receipt_no} | OpenSkools`,
      html:    htmlBody,
    });

    await client.close();

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("SMTP send error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to send email via Gmail SMTP." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
