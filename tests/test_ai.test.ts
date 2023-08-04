import {AI} from '../source/engineer/ai.js';
import test from 'node:test';
// Test the AI constructor
test('AI constructor Test', async t => {
	await t.test('No process.env is set, error gets thrown', () => {
		return new Promise((resolve, reject) => {
			try {
				new AI();
				reject();
			} catch (error) {
				resolve();
			}
		});
	});
	await t.test('process.env is set, no error gets thrown', () => {
		process.env['OPENAI_API_KEY'] = 'abc';
		return new Promise((resolve, reject) => {
			try {
				new AI();
				resolve();
			} catch (error) {
				reject();
			}
		});
	});
});
