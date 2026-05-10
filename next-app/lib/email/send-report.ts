import { Resend } from 'resend';

// Provide a fallback gracefully if ENV is missing during build time
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');
const FROM_EMAIL = process.env.FROM_EMAIL || 'hello@myglow.in';

export async function sendSkinReportEmail(
  email: string, 
  name: string, 
  reportData: any, 
  reportId: string, 
  appUrl: string
) {
  const reportLink = `${appUrl}/app/report?id=${reportId}`;
  
  // Format the top 3 concerns into HTML
  const concernsHtml = (reportData.concerns || []).slice(0, 3).map((c: any) => {
    // Determine color based on severity
    const dotColor = c.severity === 'high' ? '#ef4444' : c.severity === 'moderate' ? '#f59e0b' : '#10b981';
    
    return `
      <li style="margin-bottom: 12px; font-size: 15px;">
        <span style="color: ${dotColor}; font-size: 18px;">●</span> 
        <strong style="color: #F9FAFB;">${c.name}</strong> 
        <span style="color: #9CA3AF; font-size: 13px; margin-left: 8px; text-transform: uppercase; letter-spacing: 0.5px;">${c.severity}</span>
      </li>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #0F172A; color: #ffffff; padding: 20px; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #0F172A;">
        
        <!-- Header -->
        <div style="text-align: center; border-bottom: 1px solid #1F2937; padding-bottom: 24px; margin-bottom: 32px; padding-top: 20px;">
          <h1 style="color: #D4AF37; margin: 0; font-size: 28px; font-style: italic; font-family: 'Cormorant Garamond', Georgia, serif; letter-spacing: 1px;">MY GLOW</h1>
          <p style="color: #9CA3AF; margin-top: 8px; font-size: 15px; letter-spacing: 0.5px;">Your Personalized Skin Report</p>
        </div>
        
        <!-- Glow Score Badge -->
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="display: inline-block; width: 120px; height: 120px; border-radius: 50%; border: 4px solid #D4AF37; line-height: 120px; font-size: 42px; font-weight: bold; color: #D4AF37; background-color: rgba(212, 175, 55, 0.05); box-shadow: 0 0 20px rgba(212, 175, 55, 0.1);">
            ${reportData.overallGlowScore}
          </div>
          <p style="color: #9CA3AF; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; margin-top: 16px;">Glow Score</p>
        </div>
        
        <!-- Top Concerns -->
        <div style="background-color: #111827; border: 1px solid #1F2937; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h3 style="color: #D4AF37; margin-top: 0; margin-bottom: 16px; font-size: 18px; border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 12px;">Top 3 Concerns</h3>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${concernsHtml}
          </ul>
        </div>
        
        <!-- Key Insight -->
        <div style="background-color: #111827; border: 1px solid #1F2937; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h3 style="color: #D4AF37; margin-top: 0; margin-bottom: 12px; font-size: 18px;">Expert Insight ✨</h3>
          <p style="color: #E5E7EB; line-height: 1.6; margin: 0; font-size: 15px;">
            ${reportData.insights && reportData.insights.length > 0 ? reportData.insights[0].explanation : 'Your skin has unique characteristics that we can balance with the right targeted K-beauty routine.'}
          </p>
        </div>
        
        <!-- Climate Note -->
        <div style="background-color: #111827; border: 1px solid #1F2937; border-radius: 12px; padding: 24px; margin-bottom: 40px;">
          <h3 style="color: #D4AF37; margin-top: 0; margin-bottom: 12px; font-size: 18px;">Climate Reality ⛅</h3>
          <p style="color: #E5E7EB; line-height: 1.6; margin: 0; font-size: 15px;">
            ${reportData.climateNote || 'Tailor your routine to your local city climate variations for best barrier protection and results.'}
          </p>
        </div>
        
        <!-- CTA -->
        <div style="text-align: center; margin-bottom: 48px;">
          <a href="${reportLink}" style="display: inline-block; background-color: #D4AF37; color: #000000; text-decoration: none; padding: 18px 36px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(212, 175, 55, 0.3);">
            See Your Full Report + Routine Kit &rarr;
          </a>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; font-size: 12px; color: #6B7280; border-top: 1px solid #1F2937; padding-top: 24px;">
          <p style="margin-bottom: 8px;">MY GLOW · Personalized K-Beauty for Indian Skin</p>
          <p style="margin-top: 0;"><a href="#" style="color: #6B7280; text-decoration: underline;">Unsubscribe</a> | <a href="#" style="color: #6B7280; text-decoration: underline;">Privacy Policy</a></p>
        </div>
        
      </div>
    </body>
    </html>
  `;

  return resend.emails.send({
    from: `MY GLOW <${FROM_EMAIL}>`,
    to: email,
    subject: `✨ Your MY GLOW Skin Report is here, ${name}`,
    html: html,
  });
}

export async function sendWaitlistWelcomeEmail(email: string, name: string, appUrl: string) {
  const scanLink = `${appUrl}/app/scan`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #0F172A; color: #ffffff; padding: 20px; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #0F172A;">
        
        <div style="text-align: center; border-bottom: 1px solid #1F2937; padding-bottom: 24px; margin-bottom: 32px; padding-top: 20px;">
          <h1 style="color: #D4AF37; margin: 0; font-size: 28px; font-style: italic; font-family: 'Cormorant Garamond', Georgia, serif; letter-spacing: 1px;">MY GLOW</h1>
        </div>
        
        <h2 style="text-align: center; color: #F9FAFB; font-size: 22px; font-weight: 600; margin-bottom: 24px;">Welcome to MY GLOW, ${name}! 🌸</h2>
        
        <div style="background-color: #111827; border: 1px solid #1F2937; border-radius: 12px; padding: 32px; margin-bottom: 40px; text-align: center;">
          <p style="color: #E5E7EB; line-height: 1.6; margin-top: 0; margin-bottom: 24px; font-size: 16px;">
            Your AI skin report is waiting. Complete your skin scan to get your personalized K-Beauty routine designed specifically for your skin type, concerns, and city climate.
          </p>
          
          <a href="${scanLink}" style="display: inline-block; background-color: #D4AF37; color: #000000; text-decoration: none; padding: 18px 36px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(212, 175, 55, 0.3);">
            Start My Skin Scan &rarr;
          </a>
        </div>
        
        <div style="text-align: center; font-size: 12px; color: #6B7280; border-top: 1px solid #1F2937; padding-top: 24px;">
          <p style="margin-bottom: 8px;">MY GLOW · Personalized K-Beauty for Indian Skin</p>
          <p style="margin-top: 0;"><a href="#" style="color: #6B7280; text-decoration: underline;">Unsubscribe</a> | <a href="#" style="color: #6B7280; text-decoration: underline;">Privacy Policy</a></p>
        </div>
        
      </div>
    </body>
    </html>
  `;

  return resend.emails.send({
    from: `MY GLOW <${FROM_EMAIL}>`,
    to: email,
    subject: "Welcome to MY GLOW — your AI skin report is waiting 🌸",
    html: html,
  });
}
