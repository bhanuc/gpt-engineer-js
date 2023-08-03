import * as fs from 'fs';
import * as path from 'path';

// Assuming these are imported from your application code
import { DB, DBs, archive } from '../../source/engineer/db.js';
import { getPath } from '../test_db.js';

// Mock the current date
function freezeAt(date: Date): void {
  jest.spyOn(global, 'Date').mockImplementation(() => date as unknown as Date);
}

// Setup DBs for testing
function setupDbs(tmpPath: string, _dirNames: string[]): DBs {
  // const directories = dirNames.map((name) => path.join(tmpPath, name));

  // Create DB objects
  // const dbs = directories.map((dir) => new DB(dir));

	const dbsInstance = new DBs(new DB(getPath("memory", tmpPath)), new DB(getPath("logs", tmpPath)),new DB(getPath("preprompts", tmpPath)),new DB(getPath("input", tmpPath)),new DB(getPath("workspace", tmpPath)),new DB(getPath("archive", tmpPath)));

  // Create DBs instance
  return dbsInstance;
}

// Test the archive function
test('archive', () => {
  const tmpPath = 'path/to/temp/directory';

  let dbs = setupDbs(tmpPath, ['memory', 'logs', 'preprompts', 'input', 'workspace', 'archive']);
  freezeAt(new Date('2020-12-25T17:05:55'));
  archive(dbs);
  expect(fs.existsSync(path.join(tmpPath, 'memory'))).toBeFalsy();
  expect(fs.existsSync(path.join(tmpPath, 'workspace'))).toBeFalsy();
  expect(fs.existsSync(path.join(tmpPath, 'archive', '20201225_170555'))).toBeTruthy();

  dbs = setupDbs(tmpPath, ['memory', 'logs', 'preprompts', 'input', 'workspace', 'archive']);
  freezeAt(new Date('2022-08-14T08:05:12'));
  archive(dbs);
  expect(fs.existsSync(path.join(tmpPath, 'memory'))).toBeFalsy();
  expect(fs.existsSync(path.join(tmpPath, 'workspace'))).toBeFalsy();
  expect(fs.existsSync(path.join(tmpPath, 'archive', '20201225_170555'))).toBeTruthy();
  expect(fs.existsSync(path.join(tmpPath, 'archive', '20220814_080512'))).toBeTruthy();
});
