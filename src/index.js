// Cloudflare formmail Worker
// This handles form submissions and sends emails via:
// - Cloudflare email routing
// - Resend
import { EmailMessage } from "cloudflare:email";
import { createMimeMessage, Mailbox } from "mimetext";

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
      const errorMessage = await processForm(request, env);
      if (errorMessage)
        return jsonResponse({ error: errorMessage }, 400);
      else
        return jsonResponse({ success: true, message: 'Email sent successfully' });
    } catch (error) {
      return jsonResponse({ error: `Internal server error: ${error.message}` }, 500);
    }
  },
};

async function processForm(request, env) {
  let formObject = {};
  const contentType = request.headers.get("content-type");
  if (contentType.includes("application/json")) {
    formObject = await request.json();
  } else if (contentType.includes("form")) {
    const formData = await request.formData();
    for (const [key, value] of formData) {
      formObject[key] = value;
    }
  } else {
      return 'Unexpected content type';
  }

  // if (name == 'test') {
  //     return jsonResponse({ error: 'testing (post)' }, 400);
  // }

  // if (name == 'error') {
  //     throw  new Error("throwing an error");;
  // }

  if (Object.hasOwn(env, 'TURNSTILE_SECRET_KEY'))
  {
    if (Object.hasOwn(formObject, 'turnstileToken')) {

      // Verify Turnstile CAPTCHA
      const turnstileValid = await verifyTurnstile(
        formObject.turnstileToken,
        env.TURNSTILE_SECRET_KEY,
        request.headers.get('CF-Connecting-IP')
      );

      if (!turnstileValid) {
        return 'CAPTCHA verification failed';
      }
    }  else {
      return 'The CAPTCHA token form field is missing';          
    }
    delete formObject['turnstileToken'];
  }

  return await sendEmail(
    formObject,
    env.FROM_EMAIL,
    env.TO_EMAIL,
    env
  );
}

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

async function sendEmail(formObject, fromEmail, toEmail, env) {
  let subject;
  let replyto = null;

  if (Object.hasOwn(formObject, 'email')) {
      // Validate email format
      replyto = formObject.email;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(replyto)) {
        return 'Invalid email address format';
      }
  }

  if (Object.hasOwn(formObject, 'subject')) {
    subject = formObject.subject;
    delete formObject['subject'];
  }
  else {
    subject = 'Web form submission';
  }

  if (Object.hasOwn(env, 'EMAIL_BINDING')) {
      return await sendEmailCloudflare(formObject, fromEmail, toEmail, replyto, subject, env.EMAIL_BINDING)
  }
  else if (Object.hasOwn(env, 'RESEND_API_KEY')) {
      return await sendEmailResend(formObject, fromEmail, toEmail, replyto, subject, env.RESEND_API_KEY)
  }

  return "No email sender is defined";
}

async function sendEmailCloudflare(formObject, fromEmail, toEmail, replyto, subject, emailBinding) {
  const msg = createMimeMessage();
  msg.setSender({ name: "Web form", addr: `${fromEmail}` });
  msg.setRecipient(toEmail);
  msg.setSubject(subject);
  msg.addMessage({
    contentType: "text/html",
    data: FormatEmail(formObject),
  });
  if (replyto) {
    msg.setHeader('Reply-To', new Mailbox(replyto))
  }

  let emailMessage = new EmailMessage(
    fromEmail,
    toEmail,
    msg.asRaw(),
  );
  try {
    await emailBinding.send(emailMessage);
  } catch (e) {
    return e.message;
  }

  return null;
}

// Send email using Resend API
async function sendEmailResend(formObject, fromEmail, toEmail,  replyto, subject, apiKey) {
  const emailBody = {
    from: `Web form<${fromEmail}>`,
    to: toEmail,
    subject: subject,
    html: FormatEmail(formObject),
  };
  if (replyto) {
      emailBody.reply_to = replyto;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(emailBody),
  });

  return response.ok ? null : "Resend error";
}

function FormatEmail(formObject) {
  let message = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
\t<h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
\t\tNew Form Submission
\t</h2>
`;

Object.keys(formObject).forEach(function(key) {
  if ( message.indexOf("\n") == -1 )
    message += `\t<p style="margin: 10px 0;"><strong>${key}:</strong>${escapeHtml(formObject[key])}</p>\n`;
  else
    message += `\t<div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
\t\t<p style="margin: 0;"><strong>${key}:</strong></p>
\t\t<p style="margin: 10px 0; white-space: pre-wrap;">${escapeHtml(formObject[key])}</p>
\t</div>
`;
});

  message += '</div>';
  return message;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    "\n": '<br>\n',
    "\r": '',
  };
  return text.replace(/[&<>"'\n\r]/g, (m) => map[m]);
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