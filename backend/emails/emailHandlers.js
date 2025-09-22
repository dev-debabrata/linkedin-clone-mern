import { sender, transporter } from "../lib/nodemailer.js";
import {
	createCommentNotificationEmailTemplate,
	createConnectionAcceptedEmailTemplate,
	createWelcomeEmailTemplate,
} from "./emailTemplates.js";

export const sendWelcomeEmail = async (email, name, profileUrl) => {

	try {
		const response = await transporter.sendMail({
			from: sender,
			to: email,
			subject: "Welcome to LinkedIn",
			html: createWelcomeEmailTemplate(name, profileUrl),
			category: "welcome",
		});

		console.log("Welcome Email sent successfully", response);
	} catch (error) {
		throw error;
	}
};

export const sendCommentNotificationEmail = async (
	recipientEmail,
	recipientName,
	commenterName,
	postUrl,
	commentContent
) => {

	try {
		const response = await transporter.sendMail({
			from: sender,
			to: recipientEmail,
			subject: "New Comment on Your Post",
			html: createCommentNotificationEmailTemplate(
				recipientName,
				commenterName,
				postUrl,
				commentContent
			),
			category: "comment_notification",
		});
		console.log("Comment Notification Email sent successfully", response);
	} catch (error) {
		throw error;
	}
};

export const sendConnectionAcceptedEmail = async (
	senderEmail,
	senderName,
	recipientName,
	profileUrl
) => {

	try {
		const response = await transporter.sendMail({
			from: sender,
			to: senderEmail,
			subject: `${recipientName} accepted your connection request`,
			html: createConnectionAcceptedEmailTemplate(
				senderName,
				recipientName,
				profileUrl
			),
			category: "connection_accepted",
		});
	} catch (error) {

		console.error("Error sending connection accepted email:", error);
	}
};
