import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
  host: "mail.sykeworld.com", // make sure to get ssl
  // host: "server336.web-hosting.com", //has ssl
  port: 465,
  secure: true, // true for port 465, false for other ports
  auth: {
    user: "sales@sykeworld.com",
    pass: "F0F=B9FA!(0*"
  },
  tls: {
    rejectUnauthorized: false, // Allow connection even if certificate doesn't match hostname
  },
});

const noReplyTransporter = nodemailer.createTransport({
  host: "mail.sykeworld.com", // make sure to get ssl
  // host: "server336.web-hosting.com", //has ssl
  port: 465,
  secure: true, // true for port 465, false for other ports
  auth: {
    user: "sales@sykeworld.com",
    pass: "F0F=B9FA!(0*"
  },
  tls: {
    rejectUnauthorized: false, // Allow connection even if certificate doesn't match hostname
  },
});

export async function sendPasswordResetLInk(email: string, title: string, name: string, link: string) {

  const info1 = await transporter.sendMail({
    from: '"Syke World" <sales@sykeworld.com>',
    to: email, // list of receivers
    subject: title, // Subject line
    text: "Password Reset",
    html: "<!DOCTYPE html><html><head><meta charset='utf-8'><meta http-equiv='X-UA-Compatible' content='IE=edge'><title> Reset your Password</title><meta name='viewport' content='width=device-width, initial-scale=1'><link rel='stylesheet' type='text/css' media='screen' href='main.css'><script src='main.js'></script></head><body><div><p>Hello "+name+"</p><p>Your password reset link is here below, click the link to reset your account password </p><p>"+link+"</p><p>If you didnt make this request please ignore this email.</p><p>Regards<br/>Team at Syke World Hotel, @no-reply(do not reply to this email)</p></div></body></html>",
    // html: JSON.stringify(template(email, title))
  });

  return info1.messageId
}

export async function noReply(email: string, title: string) {

  const info1 = await noReplyTransporter.sendMail({
    from: '"no-reply@sykeworld.com',
    to: email, // list of receivers
    subject: title, // Subject line
    text: "Do not Reply",
    html: "<!DOCTYPE html><html><head><meta charset='utf-8'><meta http-equiv='X-UA-Compatible' content='IE=edge'><title> Do not reply </title><meta name='viewport' content='width=device-width, initial-scale=1'><link rel='stylesheet' type='text/css' media='screen' href='main.css'><script src='main.js'></script></head><body><div><p>Hello "+email+"</p><p>We received your message and, we will gwt back to you soon. </p><p>If you didnt make this request please ignore this email.</p><p>Regards<br/>no-reply at Syke World Hotel,</p><p>Call center: <br/><li>+256-772-331128</li><li>+256-702-632200</li></p></div></body></html>",
    // html: JSON.stringify(template(email, title))
  });

  return info1.messageId
}

export async function messageReplyHtml(email: string, title: string, reply: string) {

  const info1 = await transporter.sendMail({
    from: '"Syke World Hotel" <info@sykeworld.com>',
    to: email, // list of receivers
    subject: title, // Subject line
    text: "Message Response",
    html: "<!DOCTYPE html><html><head><meta charset='utf-8'><meta http-equiv='X-UA-Compatible' content='IE=edge'><title> Reply to Message </title><meta name='viewport' content='width=device-width, initial-scale=1'><link rel='stylesheet' type='text/css' media='screen' href='main.css'><script src='main.js'></script></head><body><div><p>Hello "+email+"</p><p>We received your message and, </p><p>"+reply+"</p><p>If you didnt make this request please ignore this email. If you need more assistance please let us know</p><p>Regards<br/>Team at Syke World Hotel,</p><p>Call center: <br/><li>+256-772-331128</li><li>+256-702-632200</li></p></div></body></html>",
    // html: JSON.stringify(template(email, title))
  });

  return info1.messageId
}

export async function emailVerification(email: string, title: string, verificationcode: string) {

  const info1 = await transporter.sendMail({
    from: '"Syke World Hotel" <info@sykeworld.com>',
    to: email, // list of receivers
    subject: title, // Subject line
    text: "Account Verification",
    html: "<!DOCTYPE html><html><head><meta charset='utf-8'><meta http-equiv='X-UA-Compatible' content='IE=edge'><title> Verify your Account </title><meta name='viewport' content='width=device-width, initial-scale=1'><link rel='stylesheet' type='text/css' media='screen' href='main.css'><script src='main.js'></script></head><body><div><p>Hello "+email+"</p><p>We received your request and your verification code is </p><h3> "+verificationcode+"</h3><p>If you didnt make this request please ignore this email. If you need more assistance please let us know</p><p>Regards<br/>Team at Syke World Hotel,</p><p>Call center: <br/><li>+256-772-331128</li><li>+256-702-632200</li></p></div></body></html>",
    // html: JSON.stringify(template(email, title))
  });

  return info1.messageId
}

export async function sendWelcomeEmailWithResetLink(email: string, name: string, resetLink: string) {
  const userName = name || email.split("@")[0];
  
  const info = await transporter.sendMail({
    from: '"Syke World Hotel" <sales@sykeworld.com>',
    to: email,
    subject: "Welcome to Syke World Hotel - Set Your Password",
    text: "Welcome to Syke World Hotel",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <meta http-equiv='X-UA-Compatible' content='IE=edge'>
  <title>Welcome to Syke World Hotel</title>
  <meta name='viewport' content='width=device-width, initial-scale=1'>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: #f97316;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .button:hover {
      background: #ea580c;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to Syke World Hotel!</h1>
  </div>
  <div class="content">
    <p>Hello ${userName},</p>
    
    <p>We're thrilled to welcome you to <strong>Syke World Hotel</strong>! Your account has been successfully created.</p>
    
    <p>To get started, please set your password by clicking the button below:</p>
    
    <div style="text-align: center;">
      <a href="${resetLink}" class="button" style="color: white; text-decoration: none;">Set Your Password</a>
    </div>
    
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #6b7280; font-size: 12px;">${resetLink}</p>
    
    <p><strong>Important:</strong> This link will expire in 24 hours for security reasons. If you didn't create this account, please ignore this email.</p>
    
    <p>Once you've set your password, you'll be able to:</p>
    <ul>
      <li>Access your account dashboard</li>
      <li>Make bookings and reservations</li>
      <li>Manage your profile and preferences</li>
      <li>View your booking history</li>
    </ul>
    
    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
    
    <div class="footer">
      <p>Best regards,<br/>
      <strong>The Syke World Hotel Team</strong></p>
      <p>Call center:<br/>
      <li>+256-772-331128</li>
      <li>+256-702-632200</li></p>
      <p style="font-size: 12px; color: #9ca3af;">This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>`,
  });

  return info.messageId;
}

export async function sendBookingReceipt(
  email: string,
  customerName: string,
  bookingData: {
    bookingId: string;
    roomNumber: string;
    roomType: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    guests: number;
    totalPrice: string;
    paymentMethod: string;
    specialRequests?: string;
  }
) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <meta http-equiv='X-UA-Compatible' content='IE=edge'>
  <title>Booking Receipt - Syke World Hotel</title>
  <meta name='viewport' content='width=device-width, initial-scale=1'>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .receipt-container {
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px;
    }
    .receipt-title {
      text-align: center;
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #f97316;
    }
    .receipt-info {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #6b7280;
    }
    .info-value {
      color: #111827;
      text-align: right;
    }
    .total-section {
      background: #fef3c7;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
      text-align: center;
    }
    .total-label {
      font-size: 14px;
      color: #92400e;
      margin-bottom: 5px;
    }
    .total-amount {
      font-size: 28px;
      font-weight: bold;
      color: #f97316;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
      text-align: center;
    }
    .booking-id {
      background: #f3f4f6;
      padding: 10px;
      border-radius: 5px;
      text-align: center;
      margin-bottom: 20px;
      font-family: monospace;
      font-size: 12px;
      color: #374151;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <h1>Syke World Hotel</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Booking Receipt</p>
    </div>
    <div class="content">
      <div class="receipt-title">Thank you for your booking!</div>
      
      <div class="booking-id">
        Booking ID: ${bookingData.bookingId}
      </div>

      <div class="receipt-info">
        <div class="info-row">
          <span class="info-label">Guest Name:</span>
          <span class="info-value">${customerName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Room:</span>
          <span class="info-value">${bookingData.roomNumber} (${bookingData.roomType})</span>
        </div>
        <div class="info-row">
          <span class="info-label">Check-in:</span>
          <span class="info-value">${formatDate(bookingData.checkIn)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Check-out:</span>
          <span class="info-value">${formatDate(bookingData.checkOut)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Duration:</span>
          <span class="info-value">${bookingData.nights} night${bookingData.nights > 1 ? 's' : ''}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Guests:</span>
          <span class="info-value">${bookingData.guests}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Method:</span>
          <span class="info-value">${bookingData.paymentMethod === 'cash' ? 'Cash' : 'Online Payment'}</span>
        </div>
        ${bookingData.specialRequests ? `
        <div class="info-row">
          <span class="info-label">Special Requests:</span>
          <span class="info-value" style="text-align: right; max-width: 60%;">${bookingData.specialRequests}</span>
        </div>
        ` : ''}
      </div>

      <div class="total-section">
        <div class="total-label">Total Amount</div>
        <div class="total-amount">UGX ${parseFloat(bookingData.totalPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>

      <div class="footer">
        <p>We look forward to welcoming you to Syke World Hotel!</p>
        <p><strong>Contact Information:</strong></p>
        <p>Phone: +256-772-331128 | +256-702-632200</p>
        <p>Email: info@sykeworld.com</p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
          This is an automated receipt. Please keep this email for your records.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const info = await transporter.sendMail({
    from: '"Syke World Hotel" <info@sykeworld.com>',
    to: email,
    subject: `Booking Receipt - ${bookingData.bookingId}`,
    text: `Thank you for your booking at Syke World Hotel!\n\nBooking ID: ${bookingData.bookingId}\nRoom: ${bookingData.roomNumber} (${bookingData.roomType})\nCheck-in: ${formatDate(bookingData.checkIn)}\nCheck-out: ${formatDate(bookingData.checkOut)}\nTotal: UGX ${bookingData.totalPrice}`,
    html,
  });

  return info.messageId;
}