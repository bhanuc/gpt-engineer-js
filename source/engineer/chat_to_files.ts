import {DB} from './db.js';

export function parseChat(chat: string): Array<{path: string; code: string}> {
	let regex = /(\S+)\n\s*```[^\n]*\n(.+?)```/gs;
	let matches = Array.from(chat.matchAll(regex));

	let files: Array<{path: string; code: string}> = [];
	for (let match of matches) {
		if (match && match[1] && match[2]) {
			let path = match[1].replace(/[:<>"|?*]/g, '');

			path = path.replace(/^\[(.*)\]$/, '$1');
			path = path.replace(/^`(.*)`$/, '$1');
			path = path.replace(/[\]:]$/, '');

			let code = match[2];

			files.push({path, code});
		} else {
			console.log('match');
		}
	}

	let readme = chat.split('```')[0] || '';
	files.push({path: 'README.md', code: readme});

	return files;
}

export function toFiles(chat: string, workspace: DB) {
	workspace.set('all_output.txt', chat);
	let files = parseChat(chat);
	for (let file of files) {
		workspace.set(file.path, file.code);
	}
}
