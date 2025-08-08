// import { NextResponse } from 'next/server';
// import { Resend } from 'resend';

// const resend = new Resend(process.env.RESEND_API_KEY);

// export async function POST(req: Request) {
//   try {
//     const { recipients, subject, message } = await req.json();

//     const data = await resend.emails.send({
//       from: 'Your Name <you@yourdomain.com>',
//       to: recipients, // <--- Array of addresses
//       subject,
//       html: `<p>${message}</p>`,
//     });

//     return NextResponse.json({ success: true, data });
//   } catch (error) {
//     return NextResponse.json({ success: false, error });
//   }
// }
