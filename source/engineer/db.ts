import * as fs from 'fs';
import * as path from 'path';
import {mkdirp} from 'mkdirp';
import {copy} from 'fs-extra/esm';

class DB {
	path: string;

	constructor(path: string) {
		this.path = path;

		mkdirp.sync(path);
	}

	contains(key: string): boolean {
		return fs.existsSync(path.join(this.path, key));
	}

	get(key: string): string {
		let full_path = path.join(this.path, key);

		if (!fs.existsSync(full_path)) {
			throw new Error(`File '${key}' could not be found in '${this.path}'`);
		}

		return fs.readFileSync(full_path, 'utf8');
	}

	getOrDefault(key: string, defaultValue: string): string {
		try {
			return this.get(key);
		} catch (err) {
			return defaultValue;
		}
	}

	set(key: string, val: string) {
		let full_path = path.join(this.path, key);
		mkdirp.sync(path.dirname(full_path));

		if (typeof val === 'string') {
			fs.writeFileSync(full_path, val, 'utf8');
		} else {
			throw new Error('val must be a string');
		}
	}
}

class DBs {
	memory: DB;
	logs: DB;
	preprompts: DB;
	input: DB;
	workspace: DB;
	archive: DB;

	constructor(
		memory: DB,
		logs: DB,
		preprompts: DB,
		input: DB,
		workspace: DB,
		archive: DB,
	) {
		this.memory = memory;
		this.logs = logs;
		this.preprompts = preprompts;
		this.input = input;
		this.workspace = workspace;
		this.archive = archive;
	}
}

function archive(dbs: DBs): void {
	let timestamp = new Date().toISOString().replace(/:/g, '').replace(/\./g, '');
	copy(
		dbs.memory.path,
		path.join(dbs.archive.path, timestamp, path.basename(dbs.memory.path)),
	);
	copy(
		dbs.workspace.path,
		path.join(dbs.archive.path, timestamp, path.basename(dbs.workspace.path)),
	);
}

export {DB, DBs, archive};
