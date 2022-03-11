import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { User } from "./cmdb/User.class";
import { getLinkPublic } from "./lib/links";
import { IPwresetTokenEntity } from "./types/db/PwresetToken.Entity";
import WLOGGER from "./wlogger";

const transporter = nodemailer.createTransport({
	host: "mx1.xcsone.de",
	port: 587,
	secure: false,
	requireTLS: true,
	auth: {
		user: process.env.EMAIL_USERNAME,
		pass: process.env.EMAIL_PASSWORD,
	},
	logger: true
});

// transporter.sendMail({
// 	from: '"XCS Admin" <admin@xcsone.de>',
// 	to: "isayilmaz@live.de",
// 	subject: "Hello from node",
// 	text: "Hello world?",
// 	html: "<strong>Hello world?</strong>",
// 	// headers: { 'x-myheader': 'test header' }
// })
// 	.then(info => console.log("Message sent: %s", info.response))
// 	.catch(err => console.error(err));

export const sendMail = async (mailOptions: Mail.Options): Promise<SMTPTransport.SentMessageInfo> => {
	if(process.env.EMAIL_SEND !== "1"){
		WLOGGER.debug("Email Debug", mailOptions);
		mailOptions.to = "blackhole@xcsone.de";
		if(mailOptions.html) mailOptions.html += "<br />This Email should have been send to " + mailOptions.to;
	}
	if(! mailOptions.from) mailOptions.from = '"XCS Admin" <admin@xcsone.de>';

	try {
		return transporter.sendMail(mailOptions);
	} catch (err) {
		WLOGGER.error("Error Sending Email", {
			err,
			mailOptions
		});
		throw err;
	}
};

export const sendEmailVerificationToken = (user: User): void => {
	sendMail({
		to: user.email,
		subject: "[ESHOL] Verify your Email Address",
		html: `
			Hey ${user.username},<br />
			please verify your Account and this Email Address via this Link: <a href="${getLinkPublic("/verify/email/" + (user.emailVerificationToken as string))}">${getLinkPublic("/verify/email/" + (user.emailVerificationToken as string))}</a>
		`
	}).catch(err => {
		WLOGGER.error("err_send_email_user_created", err);
	});
};

export const sendEmailVerificationConfirmed = async (user: User): Promise<void> => {
	await sendMail({
		to: user.email,
		subject: "[ESHOL] Your Email Address has been confirmed",
		html: `
			Hey ${user.username},<br />
			your Eamil Address has been confirmed. You can now login to your Account.
		`
	}).catch(err => {
		WLOGGER.error("err_send_email_user_created_verification", err);
	});
};

export const sendEmailUserPwResetToken = async (user: User, token: IPwresetTokenEntity["token"]): Promise<void> => {
	await sendMail({
		to: user.email,
		subject: "[ESHOL] Password Reset",
		html: `
			Hey ${user.username},<br />
			a Password Reset was requested for this Account.<br />
			Click on the following to reset your Password: <a href="${getLinkPublic("/pwreset/" + token)}">${getLinkPublic("/pwreset/" + token)}</a>
		`
	}).catch(err => {
		WLOGGER.error("err_send_email_user_pwreset", err);
	});
};

export const sendEmailUserPwResetConfimation = async (user: User): Promise<void> => {
	await sendMail({
		to: user.email,
		subject: "[ESHOL] Password Reset Confirmed",
		html: `
			Hey ${user.username},<br />
			your Password has been successfully changed!
		`
	}).catch(err => {
		WLOGGER.error("err_send_email_user_pwreset", err);
	});
};