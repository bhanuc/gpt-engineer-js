import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import { format } from 'date-fns'
import confirm from '@inquirer/confirm';


// interface Benchmark {
//   benchFolder: string;
//   process: child_process.ChildProcessWithoutNullStreams;
//   logFile: fs.WriteStream;
// }



// function askYesNo(question: string): Promise<boolean> {
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });

//   return new Promise((resolve) => {
//     rl.question(question + ' (y/n): ', (answer) => {
//       rl.close();
//       resolve(answer.toLowerCase().trim() === 'y');
//     });
//   });
// }

function main(nBenchmarks: number | undefined = undefined): void {
  const benchmarkPath = path.join(process.cwd(), 'benchmark');
  const folders = fs.readdirSync(benchmarkPath);

  let benchmarks: Benchmark[] = [];
  for (const benchFolder of folders.slice(0, nBenchmarks)) {
    const benchFolderPath = path.join(benchmarkPath, benchFolder);
    if (fs.statSync(benchFolderPath).isDirectory()) {
      console.log(`Running benchmark for ${benchFolderPath}`);

      const logPath = path.join(benchFolderPath, 'log.txt');
      const logFile = fs.createWriteStream(logPath);
      const process = child_process.spawn('python', [
        '-u',
        '-m',
        'gpt_engineer.main',
        benchFolderPath,
        '--steps',
        'benchmark',
      ], { stdio: [null, logFile, logFile] });

      benchmarks.push({ benchFolder: benchFolderPath, process, logFile });

      console.log('You can stream the log file by running:');
      console.log(`tail -f ${logPath}`);
      console.log();
    }
  }

	interface Benchmark {
		benchFolder: string;
		process: any;
		logFile: fs.WriteStream;
		// Other properties as needed
	}

	function generateReport(benchmarks: Benchmark[], benchmarkPath: string): void {
		const reportTable: string | { Benchmark: string; Ran: string; Works: string; Perfect: string; Notes: any; }[] = []
		benchmarks.map(({ benchFolder }) => {
			const review = JSON.parse(fs.readFileSync(`${benchFolder}/memory/review`, 'utf-8'));
			reportTable.push({
				'Benchmark' : benchFolder, 'Ran' : toEmoji(review.ran), 'Works': toEmoji(review.works), 'Perfect': toEmoji(review.perfect), 'Notes': review.comments
			})
			return [
				benchFolder,
				toEmoji(review.ran),
				toEmoji(review.works),
				toEmoji(review.perfect),
				review.comments
			];
		});
		console.log('\nBenchmark report:\n');
		console.table(reportTable);
		console.log();
		askYesNo('Append report to the results file?').then(appendToResults => {
			if (appendToResults) {
				const resultsPath = `${benchmarkPath}/RESULTS.md`;
				const currentDate = format(new Date(), 'yyyy-MM-dd');
				insertMarkdownSection(resultsPath, currentDate, JSON.stringify(reportTable), 2);
			}
		});
	}

	function toEmoji(value: boolean | null): string {
		return value ? '\u2705' : '\u274C';
	}

	function insertMarkdownSection(filePath: string, sectionTitle: string, sectionText: string, level: number): void {
		const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
		const headerPrefix = '#'.repeat(level);
		const newSection = `${headerPrefix} ${sectionTitle}\n\n${sectionText}\n\n`;
		const lineNumber = lines.findIndex(line => line.startsWith(headerPrefix));
		if (lineNumber !== -1) {
			lines.splice(lineNumber, 0, newSection);
		} else {
			console.log(`Markdown file was of unexpected format. No section of level ${level} found. Did not write results.`);
			return;
		}
		fs.writeFileSync(filePath, lines.join('\n'));
	}

	function askYesNo(question: string): Promise<boolean> {
		return confirm({ message: question });
	}

  // Example: generating a report
  generateReport(benchmarks, benchmarkPath);
}


if (require.main === module) {
  main();
}
