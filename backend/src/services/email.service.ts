import nodemailer from 'nodemailer';
import { env } from '../config/env';

export class EmailService {
    private static transporter: nodemailer.Transporter | null = null;

    private static async getTransporter() {
        // If transporter exists and is not dummy, return it
        if (this.transporter) return this.transporter;

        // Check if we have valid real credentials
        const hasEnvCreds = env.ETHEREAL_USER && env.ETHEREAL_USER !== 'dummy' && env.ETHEREAL_PASS;

        if (hasEnvCreds) {
            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                auth: {
                    user: env.ETHEREAL_USER,
                    pass: env.ETHEREAL_PASS,
                },
            });
            return this.transporter;
        }

        // Fallback: Generate transient Ethereal account
        console.log("⚠️ No valid Ethereal credentials found. Generating temporary test account...");
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log(`✅ Ready to send via: ${testAccount.user}`);
        return this.transporter;
    }

    static async sendEmail(to: string, subject: string, body: string) {
        const transporter = await this.getTransporter();

        const info = await transporter.sendMail({
            from: '"ReachInbox Scheduler" <scheduler@reachinbox.ai>',
            to,
            subject,
            text: body,
            html: `<div>${body}</div>`,
        });

        console.log(`Message sent: ${info.messageId}`);
        console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        return info;
    }
}
