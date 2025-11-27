import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "mail.sykeworld.com",
  port: 465,
  secure: true,
  auth: {
    user: "support@sykeworld.com",
    pass: "fi(bO})$06&(",
  },
});

export async function POST(req: NextRequest) {
  try {
    const { name, email, check_in, check_out, guests } = await req.json();

    // Admin email
    const adminMail = await transporter.sendMail({
      from: "support@sykeworld.com",
      to: "giramiapatricia61@gmail.com", // admin
      subject: "New Booking Request",
      html: `
        <p>Hello Admin,</p>
        <p>A new booking request has been made:</p>
        <ul>
          <li>Name: ${name}</li>
          <li>Email: ${email}</li>
          <li>Check-in: ${check_in}</li>
          <li>Check-out: ${check_out}</li>
          <li>Guests: ${guests}</li>
        </ul>
        <p>Regards,<br/>Automated Booking System</p>
      `,
    });

    // Client email
    const clientMail = await transporter.sendMail({
      from: "support@sykeworld.com",
      to: email,
      subject: "Your Booking Request",
      html: `
        <p>Hello ${name},</p>
        <p>We have received your booking request with the following details:</p>
        <ul>
          <li>Check-in: ${check_in}</li>
          <li>Check-out: ${check_out}</li>
          <li>Guests: ${guests}</li>
        </ul>
        <p>We will confirm your booking shortly. Thank you for choosing us!</p>
        <p>Regards,<br/>SykeWorld Hotel</p>
      `,
    });

    console.log("Emails sent:", adminMail.messageId, clientMail.messageId);

    return NextResponse.json({ status: "OK", message: "Booking emails sent" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "ERROR", message: "Failed to send emails" }, { status: 500 });
  }
}
