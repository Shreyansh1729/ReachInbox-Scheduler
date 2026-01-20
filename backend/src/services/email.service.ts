import nodemailer from 'nodemailer';
import { env } from '../config/env';

export class EmailService {
    private static transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: env.ETHEREAL_USER,
            pass: env.ETHEREAL_PASS,
        },
    });

    static async sendEmail(to: string, subject: string, body: string) {
        if (!this.transporter) {
            const testAccount = await nodemailer.createTestAccount();
            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: testAccount.user, // generated ethereal user
                    pass: testAccount.pass, // generated ethereal password
                },
            });
            console.log("Created transient Ethereal test account:", testAccount.user);
        }

        // If defined but "dummy", try to replace (lazy init logic is better but let's just make it work)
        // Actually, the static initializer runs once. 
        // Let's refactor to initialize on first send if dummy

        if (env.ETHEREAL_USER === 'dummy') {
            // Overwrite global transporter if it looks like the initial dummy one
            // We can just create a fresh one
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
            console.log("Replaced dummy credentials with transient account:", testAccount.user);
            // Patch env so we don't recreate every time (hacky but works for this run)
            (env as any).ETHEREAL_USER = testAccount.user;
        }

        const info = await this.transporter.sendMail({
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
