import { exec } from "child_process";
import { AI, Message } from "./ai.js"; 
import { DBs} from "./db.js";
import { humanInput } from "./learning.js";
import { toFiles } from "./chat_to_files.js";
import inquirer from "inquirer";


export enum Config {
    DEFAULT = "default",
    BENCHMARK = "benchmark",
    SIMPLE = "simple",
    TDD = "tdd",
    TDD_PLUS = "tdd+",
    CLARIFY = "clarify",
    RESPEC = "respec",
    EXECUTE_ONLY = "execute_only",
    EVALUATE = "evaluate",
    USE_FEEDBACK = "use_feedback"
}
function currFn(): string {
    const err = new Error();
    return err.stack?.split('\n')[2]?.split(' ')[5] || '';
}

function getPrompt(dbs: DBs): string {
    
    // if (!('prompt' in dbs.input) && !('main_prompt' in dbs.input)) {
    //     throw new Error('Please put your prompt in the file `prompt` in the project directory');
    // }

    // if (!('prompt' in dbs.input)) {
    //     console.log('Please put the prompt in the file `prompt`, not `main_prompt');
    //     console.log();
    //     return dbs.input['main_prompt'] as string;
    // }

    return dbs.preprompts.get('prompt') as string;
}

// This assumes the AI class and its methods are defined with the same interface in TypeScript
async function simpleGen(ai: AI, dbs: DBs): Promise <Message[]> {
    const messages = await ai.start(setupSysPrompt(dbs), getPrompt(dbs), currFn());
    let msg = messages[messages.length - 1]?.content.trim();
    if (msg) {
    toFiles(msg, dbs.workspace);
    }
    return messages;
}

async function clarify(ai: AI, dbs: DBs): Promise<Message[]> {
    let messages: Message[] = [ai.fsystem(dbs.preprompts.get('clarify'))];
    let userInput = getPrompt(dbs);
    while (true) {
        messages = await ai.next(messages, userInput, currFn());
        let msg = messages[messages.length - 1]?.content.trim();
        if (msg === 'Nothing more to clarify.') {
            break;
        }
        if (msg?.toLowerCase().startsWith('no')) {
            console.log('Nothing more to clarify.');
            break;
        }
        console.log(msg, "in clarify");
        userInput =( await inquirer.prompt([{
            type: 'input',
            name: 'userInput',
            message:`${msg}(answer in text, or "c" to move on)\n`}])).userInput;
 
        console.log();
        if (!userInput || userInput === 'c') {
            console.log('(letting gpt-engineer make its own assumptions)');
            console.log();
            messages = await ai.next(
                messages,
                'Make your own assumptions and state them explicitly before starting',
                currFn()
            );
            console.log();
            return messages;
        }
        userInput += (
            '\n\n' +
            'Is anything else unclear? If yes, only answer in the form:\n' +
            '{remaining unclear areas} remaining questions.\n' +
            '{Next question}\n' +
            'If everything is sufficiently clear, only answer "Nothing more to clarify.".'
        );
    }
    console.log();
    return messages;
}

function setupSysPrompt(dbs: DBs): string {
    return dbs.preprompts.get("generate") + "\nUseful to know:\n" + dbs.preprompts.get("philosophy");
}

async function genClarifiedCode(ai: AI, dbs: DBs): Promise<Message[]> {
    let messages: Message[] = AI.deserializeMessages(dbs.logs.get('clarify'));

    messages = [
        ai.fsystem(setupSysPrompt(dbs)),
        ...messages.slice(1)
    ];
    messages = await ai.next(messages, dbs.preprompts.get('use_qa'), currFn());
    let msg = messages[messages.length - 1]?.content.trim();
    if(msg ) {
        toFiles( msg, dbs.workspace);
    }

    return messages;
}


async function genEntrypoint(ai: AI, dbs: DBs): Promise<Message[]> {
    let messages: Message[] = await ai.start(
        "You will get information about a codebase that is currently on disk in " +
        "the current folder.\n" +
        "From this you will answer with code blocks that includes all the necessary " +
        "unix terminal commands to " +
        "a) install dependencies " +
        "b) run all necessary parts of the codebase (in parallel if necessary).\n" +
        "Do not install globally. Do not use sudo.\n" +
        "Do not explain the code, just give the commands.\n" +
        "Do not use placeholders, use example values (like . for a folder argument) " +
        "if necessary.\n",
        "Information about the codebase:\n\n" + dbs.workspace.get("all_output.txt"),
        currFn()
    );

    console.log();

    let regex = /```\S*\n(.+?)```/gs;
    let msg = messages[messages.length - 1]?.content.trim();
    if (msg) {
    let matches = Array.from(msg.matchAll(regex));
    dbs.workspace.set("run.sh", matches.map(match => match[1]).join("\n"));
        
    }

    return messages;
}

async function humanReview( _ai: AI,dbs: DBs): Promise<void> {
    let review = await humanInput();
    dbs.memory.set("review", JSON.stringify(review));
}

export const STEPS = {
    [Config.DEFAULT]: [clarify, genClarifiedCode, genEntrypoint, executeEntrypoint, humanReview],
    [Config.BENCHMARK]: [simpleGen, genEntrypoint],
    [Config.SIMPLE]: [simpleGen, genEntrypoint, executeEntrypoint],
};

async function executeEntrypoint(_ai: AI, dbs: DBs): Promise <Message[]> {
    const command = dbs.workspace.get('run.sh');

    console.log('Do you want to execute this code?');
    console.log(command);
    const userInput  =( await inquirer.prompt([{
        type: 'input',
        name: 'userInput',
        message:'(answer in text, or "c" to move on)\n'}])).userInput;
    if (!['', 'y', 'yes'].includes(userInput)) {
        console.log('Ok, not executing the code.');
        return [];
    }
    console.log('Executing the code...');
    exec(command, { cwd: dbs.workspace.path }, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
    return [];
}
