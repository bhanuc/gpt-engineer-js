import * as fs from 'fs';
import * as path from 'path';
import {AI} from '../source/engineer/ai.js';
import {toFiles} from '../source/engineer/chat_to_files.js';
import {DB} from '../source/engineer/db.js';

// interface AIOptions {
//   model_name: string;
//   temperature: number;
// }

// class AI {
//   constructor(private options: AIOptions) {}

//   next(messages: any, step_name: string = 'rerun'): any {
//     // Implement the logic for the next method here
//     // Return the processed messages
//   }
// }

// function to_files(content: any, outPath: string): void {
//   // Implement the logic for saving content to files
// }

export async function main(
	messagesPath: string,
	outPath: string | null = null,
	model: string = 'gpt-4',
	temperature: number = 0.1,
): Promise<void> {
	const ai = new AI(model, temperature);

	const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
	const processedMessages = await ai.next(messages, '');
	const msg = processedMessages[processedMessages.length - 1];
	if (outPath && msg) {
		toFiles(msg['content'], new DB(outPath));
		fs.writeFileSync(
			path.join(outPath, 'all_output.txt'),
			JSON.stringify(msg['content']),
		);
	}
}

// Call the main function if this script is run directly
// if (require.main === module) {
//   main(process.argv[2], process.argv[3], process.argv[4], parseFloat(process.argv[5]));
// }
