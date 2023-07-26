import * as fs from 'fs/promises';
import * as fsp from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DB, DBs } from './db.js';
import inquirer from 'inquirer';
import chalk from 'chalk';


const TERM_CHOICES = chalk.green("y")
    + "/"
    + chalk.red("n")
    + "/"
    + chalk.yellow("u")
    + "(ncertain): "

type InputOpt = boolean | null | undefined;

class Review {
    ran: InputOpt;
    perfect: InputOpt;
    works: InputOpt;
    comments: string;
    raw: string;

    constructor({ ran = null, perfect = null, works = null, comments = '', raw = '' }: {
        ran: InputOpt;
        perfect: InputOpt;
        works: InputOpt;
        comments: string;
        raw: string;
    }) {
        this.ran = ran;
        this.perfect = perfect;
        this.works = works;
        this.comments = comments;
        this.raw = raw;
    }
}

export interface Learning {
    model: string;
    temperature: number;
    steps: string;
    steps_file_hash: string;
    prompt: string;
    logs: string;
    workspace: string;
    feedback?: string;
    session: string;
    review?: Review;
    timestamp: string;
    version: string;
}

export type InputOpts = 'y' | 'n' | 'u' | '';

// export function getUserInput (ai: AI, inputString: string) {
//     ai.state.setMode(2);
//     ai.state.setQueryTitle(inputString);
// }

export async function humanInput(): Promise<Review> {
    console.log('To help gpt-engineer learn, please answer 3 questions:');

    let { ran } = await inquirer.prompt([{
        type: 'input',
        name: 'ran',
        message: 'Did the generated code run at all? ' + TERM_CHOICES,
    }]);
    while (!['y', 'n', 'u'].includes(ran)) {
        ran = (await inquirer.prompt([{
            type: 'input',
            name: 'ran',
            message: 'Invalid input. Please enter y, n, or u: '
        }])).ran;

    }

    let perfect = '';
    let useful = '';

    if (ran === 'y') {
        perfect = (await inquirer.prompt([{
            type: 'input',
            name: 'perfect',
            message: 'Did the generated code do everything you wanted? ' + TERM_CHOICES
        }])).perfect;

        while (!['y', 'n', 'u'].includes(perfect)) {
            perfect = (await inquirer.prompt([{
                type: 'input',
                name: 'perfect',
                message: 'Invalid input. Please enter y, n, or u: '
            }])).perfect;
        }

        if (perfect !== 'y') {
            useful = (await inquirer.prompt([{
                type: 'input',
                name: 'useful',
                message: 'Did the generated code do anything useful? ' + TERM_CHOICES
            }])).useful;

            while (!['y', 'n', 'u'].includes(useful)) {
                useful = (await inquirer.prompt([{
                    type: 'input',
                    name: 'useful',
                    message: 'Invalid input. Please enter y, n, or u: '
                }])).useful;
            }
        }
    }

    let comments = '';
    if (perfect !== 'y') {
        comments = (await inquirer.prompt([{
            type: 'input',
            name: 'comments',
            message: 'If you have time, please explain what was not working (ok to leave blank)\n'
        }])).comments;
    }

    checkConsent();
    let mapper = { y: true, n: false, u: null, '': null };
    const reviewObj = {
        raw: [ran, perfect, useful].join(', '),
        ran: mapper[ran as InputOpts],
        works: mapper[useful as InputOpts],
        perfect: mapper[perfect as InputOpts],
        comments: comments,
    } as Review;
    return new Review(reviewObj);
}


function checkConsent() {
    // Implement the function here...
}

export function collectConsent(): boolean {
    // Implement the function here...
    return true;
}
function logsToString(steps: any, logs: DB): string {
    const chunks = [];
    for (const step of steps) {
        chunks.push(`--- ${step.name} ---\n`);
        chunks.push(logs.get(step.name));
    }
    return chunks.join('\n');
}





export async function extractLearning(
    model: string,
    temperature: number,
    steps: any,
    dbs: DBs,
    stepsFileHash: string
): Promise<Learning> {
    let review: Review | undefined = undefined;

    if (dbs.memory.get('review')) {
        review = dbs.memory.get("review") as any;
    }

    const learning: Learning = {
        prompt: dbs.input.get("prompt"),
        model: model,
        temperature: temperature,
        steps: JSON.stringify(steps.map((step: any) => step.name)),
        steps_file_hash: stepsFileHash,
        feedback: dbs.input.get("feedback"),
        session: await getSession(),
        logs: await logsToString(steps, dbs.logs),
        workspace: dbs.workspace.get("all_output.txt"),
        review: review,
        timestamp: new Date().toISOString(),
        version: '1'
    };

    return learning;
}


async function getSession(): Promise<string> {
    const filepath = path.join(os.tmpdir(), 'gpt_engineer_user_id.txt');

    try {
        let userId: string;
        if (fsp.existsSync(filepath)) {
            userId = await fs.readFile(filepath, 'utf-8');
        } else {
            userId = Math.floor(Math.random() * Math.pow(2, 32)).toString();
            await fs.writeFile(filepath, userId, 'utf-8');
        }
        return userId;
    } catch (error) {
        console.error(error);
        return 'ephemeral_' + Math.floor(Math.random() * Math.pow(2, 32));
    }
}
