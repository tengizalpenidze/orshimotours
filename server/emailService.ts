import { MailService } from '@sendgrid/mail';

let mailService: MailService | null = null;

if (process.env.SENDGRID_API_KEY) {
  mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn("SENDGRID_API_KEY not set - email functionality will be disabled");
}

interface BookingEmailParams {
  tourTitle: string;
  tourDate: string;
  numberOfPeople: number;
  phoneNumber: string;
  email?: string;
  specialRequests?: string;
  totalPrice: string;
  bookingId: string;
}

export async function sendBookingNotificationEmail(
  params: BookingEmailParams
): Promise<boolean> {
  if (!mailService) {
    console.warn('Email functionality disabled - SENDGRID_API_KEY not configured');
    return false;
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'david.alpenidze@gmail.com';
  const fromEmail = process.env.FROM_EMAIL || 'david.alpenidze@gmail.com';

  try {

    const emailContent = `
      <h2>New Tour Booking Request</h2>
      <p><strong>Booking ID:</strong> ${params.bookingId}</p>
      <p><strong>Tour:</strong> ${params.tourTitle}</p>
      <p><strong>Date:</strong> ${new Date(params.tourDate).toLocaleDateString()}</p>
      <p><strong>Number of People:</strong> ${params.numberOfPeople}</p>
      <p><strong>Phone Number:</strong> ${params.phoneNumber}</p>
      ${params.email ? `<p><strong>Email:</strong> ${params.email}</p>` : ''}
      <p><strong>Total Price:</strong> ${params.totalPrice}</p>
      ${params.specialRequests ? `<p><strong>Special Requests:</strong> ${params.specialRequests}</p>` : ''}
      
      <hr>
      <p>Please contact the customer to confirm or reject this booking.</p>
    `;

    await mailService.send({
      to: adminEmail,
      from: fromEmail,
      subject: `New Tour Booking: ${params.tourTitle}`,
      html: emailContent,
    });

    return true;
  } catch (error: any) {
    console.error('SendGrid email error:', error);
    
    // Provide specific guidance for 403 Forbidden errors
    if (error?.code === 403) {
      console.error('\n🚨 SendGrid 403 Forbidden Error - Setup Required:');
      console.error('1. Check API Key Permissions:');
      console.error('   - Go to SendGrid Dashboard > Settings > API Keys');
      console.error('   - Edit your API key and set permissions to "Full Access"');
      console.error('   - OR ensure "Mail Send" permission is enabled');
      console.error('');
      console.error('2. Verify Sender Email:');
      console.error('   - Go to Settings > Sender Authentication');
      console.error('   - Complete "Single Sender Verification" for:', fromEmail);
      console.error('   - OR set up Domain Authentication for your domain');
      console.error('');
      console.error('3. Wait a few minutes after making changes for propagation');
      console.error('   Then restart your application and test again');
    }
    
    return false;
  }
}

export async function sendBookingConfirmationEmail(
  customerEmail: string,
  params: BookingEmailParams
): Promise<boolean> {
  if (!customerEmail) return true; // Email is optional
  
  if (!mailService) {
    console.warn('Email functionality disabled - SENDGRID_API_KEY not configured');
    return false;
  }

  try {
    const fromEmail = process.env.FROM_EMAIL || 'david.alpenidze@gmail.com';

    const emailContent = `
      <h2>Booking Confirmation - Orshimo Tours</h2>
      <p>Dear Customer,</p>
      <p>Thank you for booking with Orshimo Tours! Your booking has been confirmed.</p>
      
      <h3>Booking Details:</h3>
      <p><strong>Booking ID:</strong> ${params.bookingId}</p>
      <p><strong>Tour:</strong> ${params.tourTitle}</p>
      <p><strong>Date:</strong> ${new Date(params.tourDate).toLocaleDateString()}</p>
      <p><strong>Number of People:</strong> ${params.numberOfPeople}</p>
      <p><strong>Total Price:</strong> ${params.totalPrice}</p>
      
      <p>Our tour guide will contact you at ${params.phoneNumber} with further details.</p>
      
      <p>We look forward to showing you the beauty of Georgia!</p>
      <p>Best regards,<br>Orshimo Tours Team</p>
    `;

    await mailService.send({
      to: customerEmail,
      from: fromEmail,
      subject: 'Booking Confirmation - Orshimo Tours',
      html: emailContent,
    });

    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}
