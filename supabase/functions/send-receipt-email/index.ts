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
      // Split payment fields
      is_split,
      total_fee,
      total_paid,
      balance_due,
      installments,
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

    // ── Build installment history rows ────────────────────────────────
    const installmentRows = (is_split && Array.isArray(installments) && installments.length > 0)
      ? installments.map((inst: { index: number; date: string; receipt_no: string; payment_mode: string; amount: string; is_current?: boolean }) => {
          const bg = inst.is_current ? '#eff6ff' : (inst.index % 2 === 0 ? '#ffffff' : '#f8fafc');
          const badge = inst.is_current
            ? `<span style="display:inline-block;background:#dbeafe;color:#1d4ed8;font-size:9px;font-weight:700;padding:1px 6px;border-radius:10px;margin-left:6px;">This Receipt</span>`
            : '';
          return [
            `<tr style="background:${bg};">`,
            `<td style="padding:8px 12px;color:#64748b;font-size:12px;">${inst.index}</td>`,
            `<td style="padding:8px 12px;color:#0f172a;font-size:12px;">${inst.date}</td>`,
            `<td style="padding:8px 12px;color:#0f172a;font-size:12px;font-family:monospace;">${inst.receipt_no}${badge}</td>`,
            `<td style="padding:8px 12px;color:#0f172a;font-size:12px;">${inst.payment_mode}</td>`,
            `<td style="padding:8px 12px;color:#16a34a;font-size:12px;font-weight:700;text-align:right;">${inst.amount}</td>`,
            `</tr>`,
          ].join('');
        }).join('\n')
      : '';

    // ── Split payment summary block ───────────────────────────────────
    const splitSummaryBlock = (is_split && total_fee && total_paid) ? [
      '<tr>',
      '<td style="padding:0 36px 8px;">',
      '<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;font-size:13px;">',

      '<tr style="background:#f8fafc;">',
      '<td style="padding:10px 16px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0;">Total Course Fee</td>',
      `<td style="padding:10px 16px;color:#0f172a;border-bottom:1px solid #e2e8f0;font-weight:600;">${total_fee}</td>`,
      '</tr>',

      '<tr>',
      '<td style="padding:10px 16px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0;">Total Paid So Far</td>',
      `<td style="padding:10px 16px;color:#16a34a;border-bottom:1px solid #e2e8f0;font-weight:700;">${total_paid}</td>`,
      '</tr>',

      `<tr style="background:${Number((balance_due || '').replace(/[^0-9.]/g, '')) > 0 ? '#fff7ed' : '#f0fdf4'};">`,
      `<td style="padding:10px 16px;font-weight:700;color:${Number((balance_due || '').replace(/[^0-9.]/g, '')) > 0 ? '#c2410c' : '#166534'};">`,
      `${Number((balance_due || '').replace(/[^0-9.]/g, '')) > 0 ? 'Balance Due' : 'Balance (Cleared)'}`,
      '</td>',
      `<td style="padding:10px 16px;font-weight:700;color:${Number((balance_due || '').replace(/[^0-9.]/g, '')) > 0 ? '#ea580c' : '#16a34a'};">`,
      `${Number((balance_due || '').replace(/[^0-9.]/g, '')) > 0 ? balance_due : 'Rs. 0.00 ✓'}`,
      '</td>',
      '</tr>',

      '</table>',
      '</td></tr>',
    ].join('\n') : '';

    // ── Installment history table block ──────────────────────────────
    const installmentBlock = (is_split && installmentRows) ? [
      '<tr>',
      '<td style="padding:0 36px 24px;">',
      '<p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#0f172a;">Installment Breakdown</p>',
      '<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;font-size:12px;">',

      // Header row
      '<tr style="background:#0077b6;">',
      '<th style="padding:9px 12px;color:#ffffff;font-size:11px;text-align:left;font-weight:600;">#</th>',
      '<th style="padding:9px 12px;color:#ffffff;font-size:11px;text-align:left;font-weight:600;">Date</th>',
      '<th style="padding:9px 12px;color:#ffffff;font-size:11px;text-align:left;font-weight:600;">Receipt No</th>',
      '<th style="padding:9px 12px;color:#ffffff;font-size:11px;text-align:left;font-weight:600;">Mode</th>',
      '<th style="padding:9px 12px;color:#ffffff;font-size:11px;text-align:right;font-weight:600;">Amount</th>',
      '</tr>',

      installmentRows,

      // Total row
      '<tr style="background:#eff6ff;border-top:2px solid #bfdbfe;">',
      '<td colspan="4" style="padding:9px 12px;font-weight:700;color:#1d4ed8;font-size:12px;">Total Paid</td>',
      `<td style="padding:9px 12px;font-weight:700;color:#1d4ed8;font-size:12px;text-align:right;">${total_paid}</td>`,
      '</tr>',

      '</table>',
      '</td></tr>',
    ].join('\n') : '';

    // ── Build HTML email body ─────────────────────────────────────────
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
      '<td style="padding:32px 36px 16px;">',
      '<h2 style="margin:0;font-size:20px;color:#0f172a;">Payment Receipt</h2>',
      `<p style="margin:8px 0 0;color:#64748b;font-size:14px;">Dear <strong>${to_name || student_name || "Student"}</strong>, your payment has been received successfully.</p>`,
      is_split ? '<p style="margin:6px 0 0;display:inline-block;background:#fef3c7;color:#92400e;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;">⚡ Split / Installment Payment</p>' : '',
      '</td></tr>',

      // Receipt Details Table
      '<tr>',
      '<td style="padding:0 36px 16px;">',
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
      '<td style="padding:14px 16px;font-weight:700;color:#166534;font-size:15px;">Amount Paid (This Receipt)</td>',
      `<td style="padding:14px 16px;font-weight:700;color:#16a34a;font-size:17px;">${amount}</td>`,
      '</tr>',

      '</table>',
      '</td></tr>',

      // Split Payment Summary (if applicable)
      splitSummaryBlock,

      // Installment Breakdown Table (if applicable)
      installmentBlock,

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
