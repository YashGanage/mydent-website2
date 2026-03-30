// Vercel Serverless Function: /api/notify
// Handles SMS to customer + WhatsApp to clinic owner via Twilio

let twilio;
try {
  twilio = require('twilio');
} catch (e) {
  console.error('Twilio module not found:', e.message);
}

// Load .env for local development
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available in production (that's fine, Vercel injects env vars)
}

module.exports = async function handler(req, res) {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Read Twilio credentials from Environment Variables
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE;
  const clinicWhatsApp = process.env.CLINIC_WHATSAPP_NUMBER || '918080092321';

  if (!accountSid || !authToken || !twilioPhone) {
    console.error('Missing Twilio environment variables:', {
      hasSid: !!accountSid,
      hasToken: !!authToken,
      hasPhone: !!twilioPhone
    });
    return res.status(500).json({ error: 'Server configuration error: missing Twilio credentials' });
  }

  if (!twilio) {
    return res.status(500).json({ error: 'Twilio module failed to load' });
  }

  const client = twilio(accountSid, authToken);

  try {
    // Parse body - handle both string and object
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { name, phone, service, timeSlot } = body;

    // Validate incoming data
    if (!name || !phone || !service) {
      return res.status(400).json({ error: 'Missing required fields: name, phone, service' });
    }

    // Normalize the phone number for India (+91)
    const customerPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;

    const results = { sms: null, whatsapp: null };

    // ──────────────────────────────────────────────
    // 1. SMS NOTIFICATION TO CUSTOMER
    // ──────────────────────────────────────────────
    try {
      const smsMessage = await client.messages.create({
        body: `Hi ${name}, your appointment for ${service} has been received. We will contact you shortly. - MyDent Clinic`,
        from: twilioPhone,
        to: customerPhone
      });
      console.log('SMS sent to customer:', smsMessage.sid);
      results.sms = smsMessage.sid;
    } catch (smsErr) {
      console.error('SMS Error:', smsErr.message);
      results.sms = 'failed: ' + smsErr.message;
    }

    // ──────────────────────────────────────────────
    // 2. WHATSAPP NOTIFICATION TO CLINIC OWNER
    // ──────────────────────────────────────────────
    try {
      const whatsappMessage = await client.messages.create({
        body: `New Appointment Booking:\nName: ${name}\nPhone: ${phone}\nService: ${service}\nTime Slot: ${timeSlot || 'Not specified'}`,
        from: `whatsapp:${twilioPhone}`,
        to: `whatsapp:+${clinicWhatsApp}`
      });
      console.log('WhatsApp sent to clinic:', whatsappMessage.sid);
      results.whatsapp = whatsappMessage.sid;
    } catch (waErr) {
      console.error('WhatsApp Error:', waErr.message);
      results.whatsapp = 'failed: ' + waErr.message;
    }

    // Return results
    return res.status(200).json({
      result: 'success',
      smsSid: results.sms,
      whatsappSid: results.whatsapp
    });

  } catch (error) {
    console.error('Twilio Notification Error:', error.message);
    return res.status(500).json({
      result: 'error',
      error: error.message
    });
  }
};
