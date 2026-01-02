import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "mail.sykeworld.com",
  port: 465,
  secure: true,
  auth: {
    user: "sales@sykeworld.com",
    pass: "F0F=B9FA!(0*",
  },
  tls: {
    rejectUnauthorized: false, // Allow connection even if certificate doesn't match hostname
  },
});

export async function POST(req: NextRequest) {
  try {
    const { name, email, check_in, check_out, guests } = await req.json();

    // Only send admin notification if we have valid email data
    // Skip client email since this is just an availability check
    if (email && email !== "client@example.com" && email.includes("@")) {
      // Admin email notification
      const adminMail = await transporter.sendMail({
        from: "sales@sykeworld.com",
        to: "giramiapatricia61@gmail.com", // admin
        subject: "New Availability Check Request",
        html: `
          <p>Hello Admin,</p>
          <p>A new availability check has been made:</p>
          <ul>
            ${name ? `<li>Name: ${name}</li>` : ''}
            <li>Email: ${email}</li>
            <li>Check-in: ${check_in}</li>
            <li>Check-out: ${check_out}</li>
            <li>Guests: ${guests}</li>
          </ul>
          <p>Regards,<br/>Automated Booking System</p>
        `,
      });

      console.log("Admin notification sent:", adminMail.messageId);
    }

    // Return success - availability check doesn't require email confirmation
    return NextResponse.json({ status: "OK", message: "Availability check completed" });
  } catch (err) {
    console.error(err);
    // Don't fail the request if email fails - availability check should still work
    return NextResponse.json({ status: "OK", message: "Availability check completed (email notification may have failed)" });
  }
}
