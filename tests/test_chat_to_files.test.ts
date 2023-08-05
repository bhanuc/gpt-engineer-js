import {toFiles} from '../source/engineer/chat_to_files.js';
import assert from 'node:assert';
import test from 'node:test';
import {DB} from '../source/engineer/db.js';

// Test the AI constructor
test('toFiles tests', async t => {
	const chat = `
    This is a sample program.

    file1.py
    \`\`\`python
    print("Hello, World!")
    \`\`\`

    file2.py
    \`\`\`python
    def add(a, b):
        return a + b
    \`\`\`
    `;

	const expectedFiles = {
        'file1.py': 'print("Hello, World!")',
        'file2.py': 'def add(a, b):\n        return a + b',
        'README.md': 'This is a sample program.\n\n    file1.py',
	};
	await t.test('updated', () => {
		return new Promise((resolve, reject) => {
			try {
				const workspace: any = new DB('./tests/misc');
				toFiles(chat, workspace);

				assert.strictEqual(workspace.get('all_output.txt'), chat);
				for (const [file_name, file_content] of Object.entries(expectedFiles)) {
					assert.strictEqual(workspace.get(file_name).trim(), file_content);
				}
				resolve();
			} catch (error) {
				console.log(error, "ee");

				reject();
			}
		});
	});
});
