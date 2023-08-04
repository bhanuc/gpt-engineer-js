import * as fs from 'fs';
import * as path from 'path';

function main(): void {
	const benchmarks = path.join(process.cwd(), 'benchmark');

	fs.readdirSync(benchmarks).forEach(benchmark => {
		const benchmarkPath = path.join(benchmarks, benchmark);

		if (fs.statSync(benchmarkPath).isDirectory()) {
			console.log(`Cleaning ${benchmarkPath}`);
			fs.readdirSync(benchmarkPath).forEach(item => {
				if (item === 'prompt' || item === 'main_prompt') {
					return;
				}

				const itemPath = path.join(benchmarkPath, item);

				if (fs.statSync(itemPath).isDirectory()) {
					fs.rmdirSync(itemPath, {recursive: true});
				} else {
					fs.unlinkSync(itemPath);
				}
			});
		}
	});
}

if (require.main === module) {
	main();
}
