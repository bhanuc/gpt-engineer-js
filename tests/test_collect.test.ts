// import * as rudder_analytics from 'rudders/tack.analytics';
import {DB, DBs} from '../source/engineer/db.js';
import {collectLearnings} from '../source/engineer/collect.js';
// import {Learning, extractLearning} from '../source/engineer/learning.js';
import {genCode} from '../source/engineer/steps.js';
import assert from 'node:assert';
import {mock, test} from 'node:test';

test('collect_learnings tests', async t => {
	await t.test('No process.env is set, error gets thrown', async () => {
		process.env['COLLECT_LEARNINGS_OPT_IN'] = 'true';
		const trackMock = mock.fn();

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
		const code = 'this is output\n\nit contains code';
		dbs.logs.set(
			genCode.name,
			JSON.stringify([{role: 'system', content: code}]),
		);
		dbs.workspace.set('all_output.txt', 'test workspace\n' + code);

		collectLearnings(model, temperature, steps, dbs);

		// const learnings = await extractLearning(model, temperature, steps, dbs, '');
		assert.strictEqual(trackMock.mock.calls.length, 1);
		// expect(trackMock.mock.calls[0][1].event).toBe('learning');
		// const a = {...trackMock.mock.calls[0][1].properties};
		// delete a.timestamp;
		// const b = {...learnings} as Partial<(Learning)>;
		// delete b['timestamp'];
		// expect(a).toEqual(b);

		// expect(JSON.stringify(code)).toBe(learnings.logs);
		// expect(code).toBe(learnings.workspace);
	});
});

// Add any necessary mocks, additional tests, or helper functions below
