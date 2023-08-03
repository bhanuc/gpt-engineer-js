import { DB, DBs } from '../source/engineer/db.js';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';

export const getPath = (name: string, tmpPath: string) => path.join(tmpPath, name)


describe('DB operations tests', () => {
	const tmpPath = tmpdir();

	test('DB_operations', () => {
		const db = new DB(tmpPath);

		// Test writing a value
		db.set('test_key', 'test_value');
		expect(fs.existsSync(path.join(tmpPath, 'test_key'))).toBe(true);

		// Test reading a value
		const val = db.get('test_key');
		expect(val).toBe('test_value');

		// Test error on getting non-existent key
		expect(() => { db.get('non_existent'); }).toThrowError(Error);

		// Test error on setting non-str or non-bytes value
		expect(
			db.set('key', ['Invalid', 'value'] as any )).toThrowError(TypeError);
	});

	test('DBs_initialization', () => {

		const dbsInstance = new DBs(new DB(getPath("memory", tmpPath)), new DB(getPath("logs", tmpPath)),new DB(getPath("preprompts", tmpPath)),new DB(getPath("input", tmpPath)),new DB(getPath("workspace", tmpPath)),new DB(getPath("archive", tmpPath)));


		expect(dbsInstance.memory).toBeInstanceOf(DB);
		// ... repeat for other properties
	});

	// You can add additional tests here following the same pattern.
	test('DBs_dataclass_attributes', () => {
		const dirNames = ["memory", "logs", "preprompts", "input", "workspace", "archive"];
		const directories = dirNames.map((name) => path.join(tmpPath, name));
		const dbs = directories.map((dir) => new DB(dir));
		const dbsInstance = new DBs(new DB(getPath("memory", tmpPath)), new DB(getPath("logs", tmpPath)),new DB(getPath("preprompts", tmpPath)),new DB(getPath("input", tmpPath)),new DB(getPath("workspace", tmpPath)),new DB(getPath("archive", tmpPath)));

		expect(dbsInstance.memory).toBe(dbs[0]);
		expect(dbsInstance.logs).toBe(dbs[1]);
		expect(dbsInstance.logs).toBe(dbs[1]);
		// ... repeat for other properties
	});
});

// Additional tests can be added following the structure above
