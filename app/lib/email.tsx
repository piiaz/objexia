import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});

export async function sendVerificationEmail(email: string, otp: string) {
  try {
    const info = await transporter.sendMail({
      from: '"Objexia Team" <objexia.team@gmail.com>',
      to: email, 
      subject: 'Verify your Objexia Account', 
      text: `Your verification code is: ${otp}`, 
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #fafafa;">
          <h2 style="color: #3f407e; text-align: center;">Welcome to Objexia!</h2>
          <p style="font-size: 16px; color: #333; text-align: center;">You are almost ready to start building your roadmaps.</p>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 1px solid #ddd;">
            <p style="margin: 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
            <h1 style="margin: 10px 0 0 0; color: #3f407e; font-size: 36px; letter-spacing: 5px; font-weight: 800;">${otp}</h1>
          </div>
          <p style="font-size: 14px; color: #888; text-align: center;">This code will expire in 15 minutes.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #aaa; text-align: center;">If you didn't request this email, you can safely ignore it.</p>
        </div>
      `, 
    });

    console.log("Message sent: %s", info.messageId);
    return true;

  } catch (error) {
    console.error("🚨 Error sending email:", error);
    throw new Error("Failed to send verification email");
  }
}