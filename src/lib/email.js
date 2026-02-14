/**
 * MYSTATION - Email Notification System
 * Uses Resend for transactional emails
 *
 * Required env: RESEND_API_KEY
 * Admin notifications go to: idmgatl@gmail.com
 */

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const ADMIN_EMAIL = 'idmgatl@gmail.com';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'MyStation <notifications@mystationlive.com>';

/**
 * Send admin alert when a new sale comes in
 */
export async function sendSaleAlert({ customerName, customerEmail, items, total, shippingAddress, sessionId, printfulOrderId, printifyOrderId }) {
  if (!resend) { console.warn('Resend not configured — skipping sale alert'); return { success: false }; }
  const itemList = items.map(i => `- ${i.name} x${i.quantity} — $${(i.amount / 100).toFixed(2)}`).join('\n');
  const address = shippingAddress
    ? `${shippingAddress.line1}${shippingAddress.line2 ? ', ' + shippingAddress.line2 : ''}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postal_code}`
    : 'Not provided';

  const orderIds = [
    printfulOrderId ? `Printful: #${printfulOrderId}` : null,
    printifyOrderId ? `Printify: #${printifyOrderId}` : null,
  ].filter(Boolean).join(' | ') || 'Pending';

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `NEW SALE — $${(total / 100).toFixed(2)} from ${customerName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e1a; color: #fff; padding: 32px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">NEW SALE</h1>
            <p style="color: #22c55e; font-size: 36px; font-weight: 900; margin: 8px 0;">$${(total / 100).toFixed(2)}</p>
          </div>

          <div style="background: #1a1f36; padding: 20px; border-radius: 12px; margin-bottom: 16px;">
            <h3 style="color: #3b82f6; margin: 0 0 12px 0;">Customer</h3>
            <p style="margin: 4px 0; color: #e2e8f0;"><strong>${customerName}</strong></p>
            <p style="margin: 4px 0; color: #94a3b8;">${customerEmail}</p>
          </div>

          <div style="background: #1a1f36; padding: 20px; border-radius: 12px; margin-bottom: 16px;">
            <h3 style="color: #3b82f6; margin: 0 0 12px 0;">Items</h3>
            ${items.map(i => `<p style="margin: 6px 0; color: #e2e8f0;">${i.name} x${i.quantity} — <strong>$${(i.amount / 100).toFixed(2)}</strong></p>`).join('')}
          </div>

          <div style="background: #1a1f36; padding: 20px; border-radius: 12px; margin-bottom: 16px;">
            <h3 style="color: #3b82f6; margin: 0 0 12px 0;">Shipping To</h3>
            <p style="margin: 4px 0; color: #e2e8f0;">${address}</p>
          </div>

          <div style="background: #1a1f36; padding: 20px; border-radius: 12px; margin-bottom: 16px;">
            <h3 style="color: #3b82f6; margin: 0 0 12px 0;">Fulfillment</h3>
            <p style="margin: 4px 0; color: #e2e8f0;">${orderIds}</p>
          </div>

          <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #2a2f46;">
            <p style="color: #64748b; font-size: 12px;">Stripe Session: ${sessionId?.slice(-12) || 'N/A'}</p>
            <p style="color: #64748b; font-size: 12px;">MyStation Merch Alert System</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send sale alert email:', error);
      return { success: false, error };
    }

    console.log('Sale alert email sent:', data?.id);
    return { success: true, emailId: data?.id };
  } catch (err) {
    console.error('Email service error (sale alert):', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send customer order confirmation
 */
export async function sendOrderConfirmation({ customerName, customerEmail, items, total, sessionId }) {
  if (!resend) { console.warn('Resend not configured — skipping order confirmation'); return { success: false }; }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Order Confirmed — MyStation`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e1a; color: #fff; padding: 32px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">MYSTATION</h1>
            <p style="color: #22c55e; font-size: 20px; font-weight: 700; margin: 12px 0;">Order Confirmed!</p>
          </div>

          <p style="color: #e2e8f0; margin-bottom: 20px;">Hey ${customerName.split(' ')[0]}, thanks for your order! We're getting it printed and shipped to you.</p>

          <div style="background: #1a1f36; padding: 20px; border-radius: 12px; margin-bottom: 16px;">
            <h3 style="color: #3b82f6; margin: 0 0 12px 0;">Your Order</h3>
            ${items.map(i => `<p style="margin: 6px 0; color: #e2e8f0;">${i.name} x${i.quantity} — <strong>$${(i.amount / 100).toFixed(2)}</strong></p>`).join('')}
            <hr style="border-color: #2a2f46; margin: 12px 0;" />
            <p style="color: #fff; font-weight: 700; text-align: right;">Total: $${(total / 100).toFixed(2)}</p>
          </div>

          <div style="background: #1a1f36; padding: 20px; border-radius: 12px; margin-bottom: 16px;">
            <h3 style="color: #3b82f6; margin: 0 0 12px 0;">What's Next?</h3>
            <p style="margin: 6px 0; color: #e2e8f0;">1. Your item is being printed (1-3 business days)</p>
            <p style="margin: 6px 0; color: #e2e8f0;">2. You'll get tracking info once it ships</p>
            <p style="margin: 6px 0; color: #e2e8f0;">3. Expected delivery: 5-10 business days</p>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="https://mystationlive.com" style="display: inline-block; background: #3b82f6; color: #fff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700;">Visit MyStation</a>
          </div>

          <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #2a2f46;">
            <p style="color: #64748b; font-size: 12px;">Order Ref: ${sessionId?.slice(-8) || 'N/A'}</p>
            <p style="color: #64748b; font-size: 12px;">Every purchase supports the Mike Page Foundation</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send order confirmation:', error);
      return { success: false, error };
    }

    console.log('Order confirmation sent to:', customerEmail);
    return { success: true, emailId: data?.id };
  } catch (err) {
    console.error('Email service error (order confirmation):', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send shipping notification with tracking info
 */
export async function sendShippingNotification({ customerName, customerEmail, trackingNumber, trackingUrl, carrier, items }) {
  if (!resend) { console.warn('Resend not configured — skipping shipping notification'); return { success: false }; }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [customerEmail, ADMIN_EMAIL],
      subject: `Your MyStation order has shipped!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e1a; color: #fff; padding: 32px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">MYSTATION</h1>
            <p style="color: #22c55e; font-size: 20px; font-weight: 700; margin: 12px 0;">Your Order Shipped!</p>
          </div>

          <p style="color: #e2e8f0; margin-bottom: 20px;">Hey ${customerName.split(' ')[0]}, great news! Your order is on its way.</p>

          <div style="background: #1a1f36; padding: 20px; border-radius: 12px; margin-bottom: 16px;">
            <h3 style="color: #3b82f6; margin: 0 0 12px 0;">Tracking Info</h3>
            <p style="margin: 6px 0; color: #e2e8f0;">Carrier: <strong>${carrier || 'Standard Shipping'}</strong></p>
            <p style="margin: 6px 0; color: #e2e8f0;">Tracking: <strong>${trackingNumber || 'Processing'}</strong></p>
            ${trackingUrl ? `<a href="${trackingUrl}" style="display: inline-block; margin-top: 12px; background: #3b82f6; color: #fff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Track Package</a>` : ''}
          </div>

          <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #2a2f46;">
            <p style="color: #64748b; font-size: 12px;">MyStation Merch</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send shipping notification:', error);
      return { success: false, error };
    }

    console.log('Shipping notification sent');
    return { success: true, emailId: data?.id };
  } catch (err) {
    console.error('Email service error (shipping):', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send daily analytics report to admin
 */
export async function sendDailyAnalyticsReport(report) {
  if (!resend) { console.warn('Resend not configured — skipping daily analytics report'); return { success: false }; }
  const {
    date, totalPlays, uniqueListeners, totalPageViews,
    totalPurchases, totalRevenue, topTracks, topLocations,
    deviceCounts, peakHours, topPages,
  } = report;

  const trackRows = topTracks.map((t, i) =>
    `<tr><td style="padding:6px 12px;color:#94a3b8;">${i + 1}</td><td style="padding:6px 12px;color:#e2e8f0;">${t.title}</td><td style="padding:6px 12px;color:#22c55e;font-weight:700;text-align:right;">${t.count}</td></tr>`
  ).join('');

  const locationRows = topLocations.map((l, i) =>
    `<tr><td style="padding:4px 12px;color:#94a3b8;">${i + 1}</td><td style="padding:4px 12px;color:#e2e8f0;">${l.location}</td><td style="padding:4px 12px;color:#3b82f6;font-weight:700;text-align:right;">${l.count}</td></tr>`
  ).join('');

  const peakRows = peakHours.map(h =>
    `<span style="display:inline-block;margin:2px 4px;padding:4px 10px;background:#1a1f36;border-radius:8px;color:#e2e8f0;font-size:13px;">${h.hour} <strong style="color:#f59e0b;">(${h.count})</strong></span>`
  ).join('');

  const pageRows = topPages.map(p =>
    `<tr><td style="padding:4px 12px;color:#e2e8f0;">${p.path}</td><td style="padding:4px 12px;color:#3b82f6;font-weight:700;text-align:right;">${p.count}</td></tr>`
  ).join('');

  const totalDevices = (deviceCounts.mobile || 0) + (deviceCounts.desktop || 0) + (deviceCounts.tablet || 0) + (deviceCounts.unknown || 0);
  const mobilePercent = totalDevices ? Math.round((deviceCounts.mobile / totalDevices) * 100) : 0;
  const desktopPercent = totalDevices ? Math.round((deviceCounts.desktop / totalDevices) * 100) : 0;
  const tabletPercent = totalDevices ? Math.round((deviceCounts.tablet / totalDevices) * 100) : 0;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `MyStation Daily — ${totalPlays} plays, ${uniqueListeners} listeners, $${(totalRevenue / 100).toFixed(2)} revenue`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:650px;margin:0 auto;background:#0a0e1a;color:#fff;padding:32px;border-radius:16px;">
          <div style="text-align:center;margin-bottom:24px;">
            <h1 style="color:#3b82f6;margin:0;font-size:24px;">MYSTATION DAILY</h1>
            <p style="color:#64748b;margin:4px 0 0;font-size:14px;">${date}</p>
          </div>

          <!-- KPIs -->
          <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
            <div style="flex:1;min-width:120px;background:#1a1f36;padding:16px;border-radius:12px;text-align:center;">
              <p style="color:#64748b;font-size:11px;margin:0 0 4px;text-transform:uppercase;">Plays</p>
              <p style="color:#22c55e;font-size:28px;font-weight:900;margin:0;">${totalPlays}</p>
            </div>
            <div style="flex:1;min-width:120px;background:#1a1f36;padding:16px;border-radius:12px;text-align:center;">
              <p style="color:#64748b;font-size:11px;margin:0 0 4px;text-transform:uppercase;">Listeners</p>
              <p style="color:#3b82f6;font-size:28px;font-weight:900;margin:0;">${uniqueListeners}</p>
            </div>
            <div style="flex:1;min-width:120px;background:#1a1f36;padding:16px;border-radius:12px;text-align:center;">
              <p style="color:#64748b;font-size:11px;margin:0 0 4px;text-transform:uppercase;">Page Views</p>
              <p style="color:#a855f7;font-size:28px;font-weight:900;margin:0;">${totalPageViews}</p>
            </div>
            <div style="flex:1;min-width:120px;background:#1a1f36;padding:16px;border-radius:12px;text-align:center;">
              <p style="color:#64748b;font-size:11px;margin:0 0 4px;text-transform:uppercase;">Revenue</p>
              <p style="color:#f59e0b;font-size:28px;font-weight:900;margin:0;">$${(totalRevenue / 100).toFixed(2)}</p>
            </div>
          </div>

          <!-- Top 10 Tracks -->
          ${topTracks.length > 0 ? `
          <div style="background:#1a1f36;padding:20px;border-radius:12px;margin-bottom:16px;">
            <h3 style="color:#3b82f6;margin:0 0 12px;">Top 10 Tracks</h3>
            <table style="width:100%;border-collapse:collapse;">
              <thead><tr><th style="text-align:left;padding:6px 12px;color:#475569;font-size:11px;">#</th><th style="text-align:left;padding:6px 12px;color:#475569;font-size:11px;">Track</th><th style="text-align:right;padding:6px 12px;color:#475569;font-size:11px;">Plays</th></tr></thead>
              <tbody>${trackRows}</tbody>
            </table>
          </div>` : ''}

          <!-- Top Locations -->
          ${topLocations.length > 0 ? `
          <div style="background:#1a1f36;padding:20px;border-radius:12px;margin-bottom:16px;">
            <h3 style="color:#3b82f6;margin:0 0 12px;">Top Locations</h3>
            <table style="width:100%;border-collapse:collapse;">
              <thead><tr><th style="text-align:left;padding:4px 12px;color:#475569;font-size:11px;">#</th><th style="text-align:left;padding:4px 12px;color:#475569;font-size:11px;">Location</th><th style="text-align:right;padding:4px 12px;color:#475569;font-size:11px;">Events</th></tr></thead>
              <tbody>${locationRows}</tbody>
            </table>
          </div>` : ''}

          <!-- Device Breakdown -->
          <div style="background:#1a1f36;padding:20px;border-radius:12px;margin-bottom:16px;">
            <h3 style="color:#3b82f6;margin:0 0 12px;">Devices</h3>
            <div style="display:flex;gap:16px;flex-wrap:wrap;">
              <div><span style="color:#64748b;font-size:12px;">Mobile</span><br/><span style="color:#22c55e;font-size:20px;font-weight:700;">${mobilePercent}%</span></div>
              <div><span style="color:#64748b;font-size:12px;">Desktop</span><br/><span style="color:#3b82f6;font-size:20px;font-weight:700;">${desktopPercent}%</span></div>
              <div><span style="color:#64748b;font-size:12px;">Tablet</span><br/><span style="color:#a855f7;font-size:20px;font-weight:700;">${tabletPercent}%</span></div>
            </div>
          </div>

          <!-- Peak Hours -->
          ${peakHours.length > 0 ? `
          <div style="background:#1a1f36;padding:20px;border-radius:12px;margin-bottom:16px;">
            <h3 style="color:#3b82f6;margin:0 0 12px;">Peak Hours (EST)</h3>
            <div>${peakRows}</div>
          </div>` : ''}

          <!-- Top Pages -->
          ${topPages.length > 0 ? `
          <div style="background:#1a1f36;padding:20px;border-radius:12px;margin-bottom:16px;">
            <h3 style="color:#3b82f6;margin:0 0 12px;">Top Pages</h3>
            <table style="width:100%;border-collapse:collapse;">
              <thead><tr><th style="text-align:left;padding:4px 12px;color:#475569;font-size:11px;">Page</th><th style="text-align:right;padding:4px 12px;color:#475569;font-size:11px;">Views</th></tr></thead>
              <tbody>${pageRows}</tbody>
            </table>
          </div>` : ''}

          <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #2a2f46;">
            <a href="https://mystationlive.com/admin/analytics" style="color:#3b82f6;text-decoration:none;font-size:13px;">View Full Dashboard</a>
            <p style="color:#475569;font-size:11px;margin-top:8px;">MyStation Analytics System</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send daily analytics email:', error);
      return { success: false, error };
    }

    console.log('Daily analytics email sent:', data?.id);
    return { success: true, emailId: data?.id };
  } catch (err) {
    console.error('Email service error (daily analytics):', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send admin alert for failed orders
 */
export async function sendOrderFailedAlert({ orderId, provider, error: orderError, customerEmail }) {
  if (!resend) { console.warn('Resend not configured — skipping order failed alert'); return { success: false }; }
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `ORDER FAILED — ${provider} #${orderId}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e1a; color: #fff; padding: 32px; border-radius: 16px;">
          <h1 style="color: #ef4444; text-align: center;">ORDER FAILED</h1>
          <div style="background: #1a1f36; padding: 20px; border-radius: 12px;">
            <p style="color: #e2e8f0;">Provider: <strong>${provider}</strong></p>
            <p style="color: #e2e8f0;">Order ID: <strong>${orderId}</strong></p>
            <p style="color: #e2e8f0;">Customer: <strong>${customerEmail || 'Unknown'}</strong></p>
            <p style="color: #ef4444;">Error: ${orderError || 'Unknown error'}</p>
          </div>
          <p style="color: #94a3b8; text-align: center; margin-top: 16px;">Check Stripe dashboard and ${provider} dashboard immediately.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (err) {
    console.error('Failed to send order failed alert:', err);
    return { success: false };
  }
}

/**
 * Send order status update to customer
 */
export async function sendOrderStatusUpdate({ customerName, customerEmail, orderId, provider, status, message }) {
  if (!resend) { console.warn('Resend not configured — skipping status update'); return { success: false }; }
  try {
    const statusColors = {
      'in_production': '#f59e0b',
      'sent_to_production': '#f59e0b',
      'shipped': '#22c55e',
      'delivered': '#22c55e',
      'canceled': '#ef4444',
      'failed': '#ef4444',
    };
    const color = statusColors[status] || '#3b82f6';

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Order Update — ${status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e1a; color: #fff; padding: 32px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">MYSTATION</h1>
            <p style="color: ${color}; font-size: 20px; font-weight: 700; margin: 12px 0;">Order ${status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
          </div>
          <p style="color: #e2e8f0;">Hey ${(customerName || '').split(' ')[0] || 'there'},</p>
          <p style="color: #e2e8f0;">${message || `Your order status has been updated to: ${status}`}</p>
          <div style="background: #1a1f36; padding: 20px; border-radius: 12px; margin: 16px 0;">
            <p style="color: #94a3b8; margin: 4px 0;">Provider: <strong style="color: #e2e8f0;">${provider}</strong></p>
            <p style="color: #94a3b8; margin: 4px 0;">Order: <strong style="color: #e2e8f0;">#${orderId}</strong></p>
          </div>
          <div style="text-align: center; margin-top: 24px;">
            <a href="https://mystationlive.com" style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 600;">Visit MyStation</a>
          </div>
          <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #2a2f46;">
            <p style="color: #64748b; font-size: 12px;">MyStation Merch</p>
          </div>
        </div>
      `,
    });

    if (error) { console.error('Failed to send status update:', error); return { success: false, error }; }
    console.log('Order status update sent to:', customerEmail);
    return { success: true, emailId: data?.id };
  } catch (err) {
    console.error('Email service error (status update):', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send delivery confirmation + review request to customer
 */
/**
 * Send welcome email to new subscriber with their password
 */
export async function sendWelcomeEmail({ customerName, customerEmail, password }) {
  if (!resend) { console.warn('Resend not configured — skipping welcome email'); return { success: false }; }
  try {
    const firstName = (customerName || '').split(' ')[0] || 'there';
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Welcome to MyStation!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e1a; color: #fff; padding: 32px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">MYSTATION</h1>
            <p style="color: #22c55e; font-size: 22px; font-weight: 700; margin: 12px 0;">Thank You for Joining Us!</p>
          </div>

          <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Hey ${firstName},</p>

          <div style="background: #1a1f36; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="color: #3b82f6; margin: 0 0 12px 0;">Your Account</h3>
            <p style="margin: 6px 0; color: #e2e8f0;">Email: <strong>${customerEmail}</strong></p>
            <p style="margin: 6px 0; color: #e2e8f0;">Password: <strong>${password}</strong></p>
          </div>

          <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Please shop merch, stream music, and pass the word along.
          </p>

          <p style="color: #f59e0b; font-size: 18px; font-weight: 700; text-align: center; margin-bottom: 24px; font-style: italic;">
            Independence lives in you.
          </p>

          <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 24px;">
            <a href="https://mystationlive.com/merch" style="display: inline-block; background: #3b82f6; color: #fff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700;">Shop Merch</a>
            <a href="https://mystationlive.com/music" style="display: inline-block; background: #22c55e; color: #fff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700;">Stream Music</a>
          </div>

          <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #2a2f46;">
            <p style="color: #64748b; font-size: 12px;">Every listen supports the Mike Page Foundation 501(c)(3)</p>
            <p style="color: #64748b; font-size: 12px;">MyStation — by IDMG</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error };
    }

    console.log('Welcome email sent to:', customerEmail);
    return { success: true, emailId: data?.id };
  } catch (err) {
    console.error('Email service error (welcome):', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send delivery confirmation + review request to customer
 */
export async function sendDeliveryConfirmation({ customerName, customerEmail, orderId }) {
  if (!resend) { console.warn('Resend not configured — skipping delivery confirmation'); return { success: false }; }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Your MyStation order has been delivered!`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e1a; color: #fff; padding: 32px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">MYSTATION</h1>
            <p style="color: #22c55e; font-size: 20px; font-weight: 700; margin: 12px 0;">Package Delivered!</p>
          </div>
          <p style="color: #e2e8f0; margin-bottom: 20px;">Hey ${(customerName || '').split(' ')[0] || 'there'}, your order has arrived! We hope you love it.</p>
          <div style="background: #1a1f36; padding: 20px; border-radius: 12px; margin-bottom: 16px; text-align: center;">
            <p style="color: #94a3b8; margin: 0 0 12px;">How's your merch? Share it with us!</p>
            <a href="https://mystationlive.com/merch" style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 600;">Shop More</a>
          </div>
          <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #2a2f46;">
            <p style="color: #64748b; font-size: 12px;">Order #${orderId || 'N/A'}</p>
            <p style="color: #64748b; font-size: 12px;">Every purchase supports the Mike Page Foundation</p>
          </div>
        </div>
      `,
    });

    if (error) { console.error('Failed to send delivery confirmation:', error); return { success: false, error }; }
    console.log('Delivery confirmation sent to:', customerEmail);
    return { success: true, emailId: data?.id };
  } catch (err) {
    console.error('Email service error (delivery):', err);
    return { success: false, error: err.message };
  }
}
