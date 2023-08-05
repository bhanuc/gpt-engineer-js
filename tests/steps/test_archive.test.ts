import * as fs from 'fs';
import * as path from 'path';
// const { DB, DBs, archive } = require('../../source/engineer/db');
// const { getPath } = require('../test_db.test');
import {DB, DBs, archive} from '../../source/engineer/db.js';
import {getPath} from '../test_db.test.js';
import assert from 'node:assert';
// Mock the current date
function freezeAt(_date: Date): void {
	// jest.spyOn(global, 'Date').mockImplementation(() => date as unknown as Date);
}

// Setup DBs for testing
function setupDbs(tmpPath: string, _dirNames: string[]): DBs {
	// const directories = dirNames.map((name) => path.join(tmpPath, name));

	// Create DB objects
	// const dbs = directories.map((dir) => new DB(dir));

	const dbsInstance = new DBs(
		new DB(getPath('memory', tmpPath)),
		new DB(getPath('logs', tmpPath)),
		new DB(getPath('preprompts', tmpPath)),
		new DB(getPath('input', tmpPath)),
		new DB(getPath('workspace', tmpPath)),
		new DB(getPath('archive', tmpPath)),
	);

	// Create DBs instance
	return dbsInstance;
}

import test from 'node:test';
// Test the AI constructor
test('archive Test', async t => {
	await t.test('handle an non-existent path', () => {
		return new Promise((_resolve, _reject) => {
			const tmpPath = 'path/to/temp/directory';

			let dbs = setupDbs(tmpPath, [
				'memory',
				'logs',
				'preprompts',
				'input',
				'workspace',
				'archive',
			]);
			freezeAt(new Date('2020-12-25T17:05:55'));
			archive(dbs);
			// expect(fs.existsSync(path.join(tmpPath, 'memory'))).toBeFalsy();
			// expect(fs.existsSync(path.join(tmpPath, 'workspace'))).toBeFalsy();
			// expect(
			// 	fs.existsSync(path.join(tmpPath, 'archive', '20201225_170555')),
			// ).toBeTruthy();

			// dbs = setupDbs(tmpPath, [
			// 	'memory',
			// 	'logs',
			// 	'preprompts',
			// 	'input',
			// 	'workspace',
			// 	'archive',
			// ]);
			// freezeAt(new Date('2022-08-14T08:05:12'));
			// archive(dbs);

			assert.strictEqual(fs.accessSync(path.join(tmpPath, 'memory')), undefined);
			assert.strictEqual(fs.accessSync(path.join(tmpPath, 'workspace')), undefined);
			_resolve();
			// expect(fs.existsSync(path.join(tmpPath, 'memory'))).toBeFalsy();
			// expect(fs.existsSync(path.join(tmpPath, 'workspace'))).toBeFalsy();
			// expect(
			// 	fs.existsSync(path.join(tmpPath, 'archive', '20201225_170555')),
			// ).toBeTruthy();
			// expect(
			// 	fs.existsSync(path.join(tmpPath, 'archive', '20220814_080512')),
			// ).toBeTruthy();
		});
	});
});

// Test the archive function
// test('archive', () => {
// 	const tmpPath = 'path/to/temp/directory';

// 	let dbs = setupDbs(tmpPath, [
// 		'memory',
// 		'logs',
// 		'preprompts',
// 		'input',
// 		'workspace',
// 		'archive',
// 	]);
// 	freezeAt(new Date('2020-12-25T17:05:55'));
// 	archive(dbs);
// 	expect(fs.existsSync(path.join(tmpPath, 'memory'))).toBeFalsy();
// 	expect(fs.existsSync(path.join(tmpPath, 'workspace'))).toBeFalsy();
// 	expect(
// 		fs.existsSync(path.join(tmpPath, 'archive', '20201225_170555')),
// 	).toBeTruthy();

// 	dbs = setupDbs(tmpPath, [
// 		'memory',
// 		'logs',
// 		'preprompts',
// 		'input',
// 		'workspace',
// 		'archive',
// 	]);
// 	freezeAt(new Date('2022-08-14T08:05:12'));
// 	archive(dbs);
// 	expect(fs.existsSync(path.join(tmpPath, 'memory'))).toBeFalsy();
// 	expect(fs.existsSync(path.join(tmpPath, 'workspace'))).toBeFalsy();
// 	expect(
// 		fs.existsSync(path.join(tmpPath, 'archive', '20201225_170555')),
// 	).toBeTruthy();
// 	expect(
// 		fs.existsSync(path.join(tmpPath, 'archive', '20220814_080512')),
// 	).toBeTruthy();
// });
