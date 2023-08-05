import assert from 'node:assert';
import { test} from 'node:test';
import {DB, DBs} from '../source/engineer/db.js';
import {genCode} from '../source/engineer/steps.js';
import { extractLearning } from '../source/engineer/learning.js';

test('collect_learnings tests', async t => {
	await t.test('No process.env is set, error gets thrown', async () => {
		process.env['COLLECT_LEARNINGS_OPT_IN'] = 'true';

		const model = 'test_model';
		const temperature = 0.5;
		const steps = [genCode];
		const dbs = new DBs(
			new DB('/tmp'),
			new DB('/tmp'),
			new DB('/tmp'),
			new DB('/tmp'),
			new DB('/tmp'),
			new DB('/tmp'),
		);
		dbs.input.set('prompt', 'test prompt\n with newlines');
		dbs.input.set('feedback', 'test feedback');
		dbs.memory.set('review', 'test review');
		const code = 'this is output\n\nit contains code';
		dbs.logs.set(
			genCode.name,
			JSON.stringify([{role: 'system', content: code}]),
		);
		dbs.workspace.set('all_output.txt', 'test workspace\n' + code);

		// collectLearnings(model, temperature, steps, dbs);

		const learnings = await extractLearning(model, temperature, steps, dbs, '');
		// expect(trackMock.mock.calls[0][1].event).toBe('learning');
		// const a = {...trackMock.mock.calls[0][1].properties};
		// delete a.timestamp;
		// const b = {...learnings} as Partial<(Learning)>;
		// delete b['timestamp'];
		// expect(a).toEqual(b);

		const expectedOutputLog = '--- genCode ---\n\n[{"role":"system","content":"this is output\\n\\nit contains code"}]';
		const expectedOutputWorkspace = 'test workspace\nthis is output\n\nit contains code';

		assert.strictEqual(learnings.logs, expectedOutputLog);
		assert.strictEqual(learnings.workspace,expectedOutputWorkspace);
	});
});

// Add any necessary mocks, additional tests, or helper functions below
