import nodemailer from 'nodemailer';
import ejs from 'ejs';
import { getTemplateContent } from '../helpers/template.helper';
import config from '../config/config';
import { User } from '../db/schema';

export class Mailer {
  private static transporter: nodemailer.Transporter;

  private static init() {
    if (Mailer.transporter) {
      return;
    }
    Mailer.transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      sender: config.mail.from,
      secure: config.mail.secure,
      auth: {
        user: config.mail.auth.user,
        pass: config.mail.auth.pass,
      },
    });
  }

  public static sendMail(options: nodemailer.SendMailOptions) {
    this.init();
    return Mailer.transporter.sendMail(options);
  }

  public static async sendVerificationEmail(user: User) {
    this.init();
    const emailTemplate = await getTemplateContent('email-verification.html');
    if (!emailTemplate) {
      return false;
    }
    const frontendUrl = config.frontendUrl;
    const html = ejs.render(emailTemplate, {
      appName: 'EscapeTheCode',
      verificationLink: `${frontendUrl}/verify-email?token=${user.verificationToken}`,
    });

    await Mailer.sendMail({
      from: config.mail.from,
      subject: 'Welcome!',
      html: html,
      to: user.email,
    });

    return true;
  }

  public static async sendPasswordResetEmail(user: User) {
    this.init();
    const emailTemplate = await getTemplateContent('password-reset.html');
    if (!emailTemplate) {
      return false;
    }
    const frontendUrl = config.frontendUrl;
    const html = ejs.render(emailTemplate, {
      appName: 'EscapeTheCode',
      passwordResetLink: `${frontendUrl}/password-confirm?token=${user.passwordResetToken}&email=${user.email}`,
    });

    await Mailer.sendMail({
      from: config.mail.from,
      subject: 'Reset Password',
      html: html,
      to: user.email,
    });

    return true;
  }
}
