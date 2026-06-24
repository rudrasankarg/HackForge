const nodemailer = require('nodemailer');
const EmailTelemetry = require('../models/EmailTelemetry');
const { callGemini } = require('./gemini');

// Helper to translate text using Gemini if language is not English
const translateText = async (text, targetLang) => {
  if (!text || !targetLang || targetLang === 'en') return text;
  const langNames = { es: 'Spanish', fr: 'French', de: 'German', hi: 'Hindi' };
  const langName = langNames[targetLang] || targetLang;
  
  const prompt = `You are a professional translator. Translate the following text/HTML to ${langName}. Preserve all HTML tags, link formats, and style attributes EXACTLY as they are. Translate only the user-visible content text.

Text/HTML to translate:
"${text}"

Translation only:`;
  const translated = await callGemini(prompt);
  return translated ? translated.trim() : text;
};

// Helper to attach website link to email footer
const ensureFooter = (html) => {
  if (html.includes('https://hackforge-4s9q.onrender.com')) return html;
  const footerHtml = `
    <div style="margin-top: 30px; text-align: center; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px;">
      <p style="margin: 0 0 10px 0;">Access the hackathon portal directly at HackForge:</p>
      <a href="https://hackforge-4s9q.onrender.com" style="display: inline-block; background-color: #ea580c; color: #ffffff; padding: 10px 20px; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 6px;">Go to HackForge Portal</a>
    </div>
  `;
  if (html.includes('</body>')) {
    return html.replace('</body>', `${footerHtml}</body>`);
  }
  return html + footerHtml;
};

// 1. Predict optimal send time based on past opens or high-engagement defaults
const predictOptimalSendTime = async (recipientEmail) => {
  const now = new Date();
  try {
    const pastOpens = await EmailTelemetry.find({
      recipientEmail,
      status: { $in: ['opened', 'clicked'] }
    }).limit(5);

    if (pastOpens.length > 0) {
      const hours = pastOpens.map(p => (p.openedAt || p.updatedAt).getHours());
      const avgHour = Math.round(hours.reduce((a, b) => a + b, 0) / hours.length);

      const target = new Date();
      target.setHours(avgHour, 0, 0, 0);
      if (target < now) {
        target.setDate(target.getDate() + 1);
      }
      return target;
    }
  } catch (err) {
    console.error('Error predicting optimal send time:', err.message);
  }

  // Default optimal times: 9 AM or 2 PM
  const target = new Date();
  const currentHour = now.getHours();
  if (currentHour < 9) {
    target.setHours(9, 0, 0, 0);
  } else if (currentHour < 14) {
    target.setHours(14, 0, 0, 0);
  } else {
    target.setHours(9, 0, 0, 0);
    target.setDate(target.getDate() + 1);
  }
  return target;
};

// 2. Helper to wrap links and inject 1px tracking pixel
const wrapLinksAndInjectPixel = (html, telemetryId) => {
  const backendUrl = process.env.BACKEND_URL || 'https://hackforge-4s9q.onrender.com';
  
  // Wrap href links (excluding mailto, anchor links, and existing tracking endpoints)
  let wrappedHtml = html.replace(/href="((https?:\/\/[^"]+))"/gi, (match, url) => {
    if (url.includes('/api/emails/track')) {
      return match;
    }
    return `href="${backendUrl}/api/emails/track/click/${telemetryId}?url=${encodeURIComponent(url)}"`;
  });

  // Inject tracking pixel before </body> or at the end
  const pixelTag = `<img src="${backendUrl}/api/emails/track/open/${telemetryId}" width="1" height="1" style="display:none;" alt="" />`;
  if (wrappedHtml.includes('</body>')) {
    wrappedHtml = wrappedHtml.replace('</body>', `${pixelTag}</body>`);
  } else {
    wrappedHtml += pixelTag;
  }
  return wrappedHtml;
};

const createTransporter = () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
};

// 3. Send email and record telemetry
const sendEmail = async (to, subject, html, campaignType = 'announcement', forceImmediate = false) => {
  // Get user preferred language and translate
  let targetLang = 'en';
  try {
    const User = require('../models/User');
    const userRecord = await User.findOne({ email: to });
    if (userRecord && userRecord.preferredLanguage) {
      targetLang = userRecord.preferredLanguage;
    }
  } catch (err) {
    console.error('Error fetching user preferred language:', err.message);
  }

  // Ensure universal website footer is attached
  let processedHtml = ensureFooter(html);

  // Translate if not English
  let finalSubject = subject;
  if (targetLang !== 'en') {
    try {
      finalSubject = await translateText(subject, targetLang);
      processedHtml = await translateText(processedHtml, targetLang);
    } catch (err) {
      console.error('Translation failed, sending in English:', err.message);
    }
  }

  let telemetryId = null;
  let sendTimePrediction = null;
  let isScheduled = false;

  try {
    sendTimePrediction = await predictOptimalSendTime(to);
    const now = new Date();
    
    // If optimal prediction is in the future (more than 5 mins away) and not forced, set to scheduled
    const isFuture = sendTimePrediction.getTime() - now.getTime() > 5 * 60 * 1000;
    if (isFuture && !forceImmediate && campaignType !== 'otp' && campaignType !== 'welcome') {
      isScheduled = true;
    }

    const telemetry = await EmailTelemetry.create({
      recipientEmail: to,
      subject: finalSubject,
      campaignType,
      status: isScheduled ? 'scheduled' : 'sent',
      sendTimePrediction,
      body: processedHtml,
      language: targetLang,
      sentAt: isScheduled ? null : new Date()
    });
    telemetryId = telemetry._id;
  } catch (err) {
    console.error('Failed to initialize telemetry record:', err.message);
  }

  if (isScheduled) {
    console.log(`[EMAIL QUEUED] Scheduled email for ${to} at ${sendTimePrediction.toISOString()}`);
    return;
  }

  const finalHtml = telemetryId ? wrapLinksAndInjectPixel(processedHtml, telemetryId) : processedHtml;

  const markFailed = async () => {
    if (telemetryId) {
      try {
        await EmailTelemetry.findByIdAndUpdate(telemetryId, { status: 'failed' });
      } catch (err) {
        console.error('Failed to update telemetry to failed status:', err.message);
      }
    }
  };

  // 1. Check if Brevo API Key is present (HTTPS - Not Blocked by Render)
  if (process.env.BREVO_API_KEY) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'HackForge', email: process.env.SMTP_USER || 'noreply@hackforge.dev' },
          to: [{ email: to }],
          subject: finalSubject,
          htmlContent: finalHtml
        })
      });
      if (res.ok) {
        console.log(`[EMAIL BREVO] Sent successfully to: ${to}`);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error(`[EMAIL BREVO ERROR]`, errData);
        await markFailed();
      }
    } catch (err) {
      console.error(`[EMAIL BREVO ERROR] Failed to send:`, err.message);
      await markFailed();
    }
    return;
  }

  // 2. Check if Resend API Key is present (HTTPS - Not Blocked by Render)
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.SMTP_FROM || 'onboarding@resend.dev',
          to: [to],
          subject: finalSubject,
          html: finalHtml
        })
      });
      if (res.ok) {
        console.log(`[EMAIL RESEND] Sent successfully to: ${to}`);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error(`[EMAIL RESEND ERROR]`, errData);
        await markFailed();
      }
    } catch (err) {
      console.error(`[EMAIL RESEND ERROR] Failed to send:`, err.message);
      await markFailed();
    }
    return;
  }

  // 3. Fallback to standard SMTP
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[EMAIL FALLBACK] To: ${to} | Subject: ${finalSubject}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'HackForge <noreply@hackforge.dev>',
      to,
      subject: finalSubject,
      html: finalHtml,
    });
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send email via SMTP:`, err.message);
    console.log(`[EMAIL FALLBACK] To: ${to} | Subject: ${finalSubject}`);
    await markFailed();
  }
};

const sendOtpEmail = async (to, code, name) => {
  console.log(`[OTP CODE] Verification code for ${to} is: ${code}`);
  const greetingName = name || to.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #111827; background-color: #ffffff;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">HackForge</span>
      </div>
      <div style="height: 1px; background-color: #e5e7eb; margin-bottom: 24px;"></div>
      <p style="font-size: 15px; line-height: 24px; color: #111827; margin: 0 0 16px 0;">Hello ${greetingName},</p>
      <p style="font-size: 15px; line-height: 24px; color: #374151; margin: 0 0 24px 0;">We received a request to verify the email address <strong>${to}</strong>. Use the following verification code to proceed:</p>
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 700; letter-spacing: 4px; color: #111827; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; display: inline-block; white-space: nowrap;">${code}</span>
      </div>
      <p style="font-size: 13px; line-height: 20px; color: #6b7280; margin: 0 0 24px 0;">This code is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <div style="height: 1px; background-color: #e5e7eb; margin-top: 24px; margin-bottom: 16px;"></div>
      <p style="font-size: 12px; line-height: 18px; color: #9ca3af; margin: 0;">If you did not request this code, you can safely ignore this email.</p>
    </div>
  `;
  await sendEmail(to, 'HackForge — Email Verification Code', html, 'otp');
};

const sendWelcomeEmail = async (to, name) => {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #111827; background-color: #ffffff;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">HackForge</span>
      </div>
      <div style="height: 1px; background-color: #e5e7eb; margin-bottom: 24px;"></div>
      <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 12px 0;">Welcome to HackForge, ${name}!</h2>
      <p style="font-size: 15px; line-height: 24px; color: #374151; margin: 0 0 24px 0;">Your account has been created successfully. You can now log in, join or create a team, and submit projects.</p>
      <div style="margin-bottom: 24px;">
        <a href="${process.env.CLIENT_ORIGIN || 'https://hackforge-4s9q.onrender.com'}/login" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">Go to Platform</a>
      </div>
      <div style="height: 1px; background-color: #e5e7eb; margin-top: 24px; margin-bottom: 16px;"></div>
      <p style="font-size: 12px; line-height: 18px; color: #9ca3af; margin: 0;">HackForge team</p>
    </div>
  `;
  await sendEmail(to, 'Welcome to HackForge', html, 'welcome');
};

const sendResultEmail = async (to, name, rank, score, feedbackText) => {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #111827; background-color: #ffffff;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">HackForge</span>
      </div>
      <div style="height: 1px; background-color: #e5e7eb; margin-bottom: 24px;"></div>
      <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 12px 0;">Your Hackathon results are ready</h2>
      <p style="font-size: 15px; line-height: 24px; color: #374151; margin: 0 0 16px 0;">Hello ${name},</p>
      <p style="font-size: 15px; line-height: 24px; color: #374151; margin: 0 0 16px 0;">Your team finished at rank <strong style="color: #111827;">#${rank}</strong> with a final score of <strong>${score.toFixed(1)}</strong>.</p>
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 16px 0; font-size: 14px; line-height: 20px; color: #4b5563; font-style: italic;">
        "${feedbackText}"
      </div>
      <div style="margin-bottom: 24px; margin-top: 24px;">
        <a href="${process.env.CLIENT_ORIGIN || 'https://hackforge-4s9q.onrender.com'}/login" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">View Leaderboard</a>
      </div>
      <div style="height: 1px; background-color: #e5e7eb; margin-top: 24px; margin-bottom: 16px;"></div>
      <p style="font-size: 12px; line-height: 18px; color: #9ca3af; margin: 0;">HackForge team</p>
    </div>
  `;
  await sendEmail(to, 'HackForge — Your Hackathon Results', html, 'result');
};

const sendAiEvaluationEmail = async (to, teamName, projectTitle, scores, strengths, improvements, detailedAnalysis) => {
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const avg = (total / 5).toFixed(1);
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #111827; background-color: #ffffff;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">HackForge</span>
      </div>
      <div style="height: 1px; background-color: #e5e7eb; margin-bottom: 24px;"></div>
      <h2 style="font-size: 20px; font-weight: 800; color: #111827; margin: 0 0 12px 0;">AI Project Evaluation Report</h2>
      <p style="font-size: 15px; line-height: 24px; color: #374151; margin: 0 0 16px 0;">Hello Team ${teamName || 'Hackers'},</p>
      <p style="font-size: 15px; line-height: 24px; color: #374151; margin: 0 0 16px 0;">Your project <strong>"${projectTitle}"</strong> has been analyzed by our automated AI screening models. Here is the evaluation summary:</p>
      
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="font-size: 16px; margin-top: 0; color: #111827;">Score Breakdown: ${avg}/10 Average</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 8px 0; font-size: 14px; color: #4b5563;">Innovation</td><td style="padding: 8px 0; text-align: right; font-weight: 700; color: #111827;">${scores.innovation}/10</td></tr>
          <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 8px 0; font-size: 14px; color: #4b5563;">Technical Complexity</td><td style="padding: 8px 0; text-align: right; font-weight: 700; color: #111827;">${scores.technical}/10</td></tr>
          <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 8px 0; font-size: 14px; color: #4b5563;">Impact</td><td style="padding: 8px 0; text-align: right; font-weight: 700; color: #111827;">${scores.impact}/10</td></tr>
          <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 8px 0; font-size: 14px; color: #4b5563;">Presentation</td><td style="padding: 8px 0; text-align: right; font-weight: 700; color: #111827;">${scores.presentation}/10</td></tr>
          <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 8px 0; font-size: 14px; color: #4b5563;">Feasibility</td><td style="padding: 8px 0; text-align: right; font-weight: 700; color: #111827;">${scores.feasibility}/10</td></tr>
        </table>
      </div>

      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 14px; text-transform: uppercase; color: #10b981; margin-bottom: 4px;">Key Strengths</h4>
        <p style="font-size: 14px; line-height: 20px; color: #374151; margin: 0;">${strengths}</p>
      </div>

      <div style="margin-bottom: 24px;">
        <h4 style="font-size: 14px; text-transform: uppercase; color: #ef4444; margin-bottom: 4px;">Areas for Improvement</h4>
        <p style="font-size: 14px; line-height: 20px; color: #374151; margin: 0;">${improvements}</p>
      </div>

      <div style="height: 1px; background-color: #e5e7eb; margin-top: 24px; margin-bottom: 24px;"></div>
      <p style="font-size: 12px; line-height: 18px; color: #9ca3af; margin: 0;">HackForge team — Powered by Google Gemini</p>
    </div>
  `;
  await sendEmail(to, `HackForge AI Evaluation Report — ${projectTitle}`, html, 'journey_evaluation_complete');
};

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendWelcomeEmail,
  sendResultEmail,
  sendAiEvaluationEmail,
  predictOptimalSendTime
};
