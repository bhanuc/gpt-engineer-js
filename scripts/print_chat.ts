import * as fs from 'fs';
import chalk from 'chalk';

interface Message {
	role: string;
	name?: string;
	content: string;
	function_call?: string;
}

// const app = typer.Typer();

function prettyPrintConversation(messages: Message[]): void {
	const formattedMessages: string[] = [];
	for (const message of messages) {
		if (message.role === 'function') {
			formattedMessages.push(
				`function (${message.name}): ${message.content}\n`,
			);
		} else {
			const assistantContent = message.function_call
				? message.function_call
				: message.content;
			const roleToMessage: {[key: string]: string} = {
				system: `system: ${message.content}\n`,
				user: `user: ${message.content}\n`,
				assistant: `assistant: ${assistantContent}\n`,
			};
			formattedMessages.push(roleToMessage[message.role] || '');
		}
	}

	for (const formattedMessage of formattedMessages) {
		const role =
			messages[formattedMessages.indexOf(formattedMessage)]?.role || '';

		printMessage(formattedMessage, role);
	}
}

const messagesPath = process.argv[2];
if (!messagesPath) {
	console.error('No message path passed');
} else {
	const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
	prettyPrintConversation(messages);
}

function printMessage(formattedMessage: string, role: string) {
	switch (role) {
		case 'system':
			console.log(chalk.red(formattedMessage));
			break;
		case 'user':
			console.log(chalk.green(formattedMessage));
			break;
		case 'assistant':
			console.log(chalk.blue(formattedMessage));
			break;
		case 'function':
			console.log(chalk.magenta(formattedMessage));
			break;
		default:
			console.log(chalk.yellow(formattedMessage));
			break;
	}
}
