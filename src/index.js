// Cloudflare formmail Worker
// This handles form submissions and sends emails via:
// - Cloudflare email routing
// - Resend
import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const url = new URL(request.url);
    if (url.searchParams.get("test") != null) {
        return jsonResponse({ error: 'testing (get)' }, 400);
    }

    // Only allow POST requests to /api/contact
    if (request.method !== 'POST' || !request.url.includes('/api/contact')) {
      return new Response('Not Found', { status: 404 });
    }

    try {
      let data = {};
      const contentType = request.headers.get("content-type");
      if (contentType.includes("application/json")) {
        data = await request.json();
      } else if (contentType.includes("form")) {
        const formData = await request.formData();
        for (const [key, value] of formData) {
          data[key] = value;
        }
      } else {
          return jsonResponse({ error: 'Unexpected content type' }, 400);
      }

      const { name, email, subject, message, turnstileToken } = data;

      if (name == 'test') {
          return jsonResponse({ error: 'testing (post)' }, 400);
      }

      if (name == 'error') {
          throw  new Error("throwing an error");;
      }

      // Validate required fields
      if (!name || !email || !subject || !message || !turnstileToken) {
        return jsonResponse({ error: 'All fields are required' }, 400);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return jsonResponse({ error: 'Invalid email format' }, 400);
      }

      if (Object.hasOwn(env, 'TURNSTILE_SECRET_KEY'))
      {
        // Verify Turnstile CAPTCHA
        const turnstileValid = await verifyTurnstile(
          turnstileToken,
          env.TURNSTILE_SECRET_KEY,
          request.headers.get('CF-Connecting-IP')
        );

        if (!turnstileValid) {
          return jsonResponse({ error: 'CAPTCHA verification failed' }, 400);
        }
      }  

      // Send email via Resend
      const emailSent = await sendEmail(
        {
          name,
          email,
          subject,
          message,
        },
        env.FROM_EMAIL,
        env.TO_EMAIL,
        env
      );

      if (emailSent) {
        return jsonResponse({ success: true, message: 'Email sent successfully' });
      } else {
        return jsonResponse({ error: 'Failed to send email' }, 500);
      }
    } catch (error) {
      console.error('Error processing request:', error);
      return jsonResponse({ error: `Internal server error: ${error.message}` }, 500);
    }
  },
};

// Verify Cloudflare Turnstile token
async function verifyTurnstile(token, secretKey, ip) {
  const formData = new URLSearchParams();
  formData.append('secret', secretKey);
  formData.append('response', token);
  if (ip) formData.append('remoteip', ip);

  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    }
  );

  const result = await response.json();
  return result.success;
}

async function sendEmail(formData, fromEmail, toEmail, env) {
  let success = false;
  if (Object.hasOwn(env, 'EMAIL_BINDING')) {
      success = await sendEmailCloudflare(formData, fromEmail, toEmail, env.EMAIL_BINDING)
  }
  else if (Object.hasOwn(env, 'RESEND_API_KEY')) {
      success = await sendEmailResend(formData, fromEmail, toEmail, env.RESEND_API_KEY)
  }
  return success;
}

async function sendEmailCloudflare(formData, fromEmail, toEmail, emailBinding) {
  const { name, email, subject, message } = formData;
    const msg = createMimeMessage();
    msg.setSender({ name: "Website contact", addr: `${fromEmail}` });
    msg.setRecipient(toEmail);
    //msg.reply_to(email);
    msg.setSubject(subject);
    msg.addMessage({
      contentType: "text/html",
      data: FormatEmail(formData),
    });

    let emailMessage = new EmailMessage(
      fromEmail,
      toEmail,
      msg.asRaw(),
    );
    try {
      await emailBinding.send(emailMessage);
    } catch (e) {
      return false; // new Response(e.message);
    }

    return true; // new Response("Hello Send Email World!");
}

// Send email using Resend API
async function sendEmailResend(formData, fromEmail, toEmail, apiKey) {
  const { name, email, subject, message } = formData;

  const emailBody = {
    from: `Contact Form <${fromEmail}>`, // Use your verified domain
    to: toEmail,
    subject: `Contact Form: ${subject}`,
    html: FormatEmail(formData),
    reply_to: email,
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(emailBody),
  });

  return response.ok;
}

function FormatEmail(formData) {
  const { name, email, subject, message } = formData;
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>
        <div style="margin: 20px 0;">
          <p style="margin: 10px 0;"><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p style="margin: 10px 0;"><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p style="margin: 10px 0;"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        </div>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Message:</strong></p>
          <p style="margin: 10px 0; white-space: pre-wrap;">${escapeHtml(message)}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Reply to: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>
        </p>
      </div>
    `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Helper function to create JSON responses
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}