import * as path from 'path';
// import * as typer from 'typer';  // You should find or create an equivalent library for handling command line arguments
import { AI, fallbackModel } from './ai.js';
import { collectLearnings } from './collect.js';
import { DB, DBs, archive } from './db.js';
import { collectConsent } from './learning.js';
import { STEPS, Config as StepsConfig } from './steps.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export async function Main({
    projectPath = "projects/example",
    model = "gpt-4",
    temperature = 0.1,
    stepsConfig= StepsConfig.DEFAULT,
}: { projectPath?: string, model?: string, temperature?: number, stepsConfig?: StepsConfig, verbose?: Boolean }
): Promise<void> {
    // Implement logging here...
    // console.log(verbose);
    

    model = await fallbackModel(model);
    let ai = new AI(model, temperature);
            await ai.initAI();
    let inputPath = path.resolve(projectPath);
    let memoryPath = path.join(inputPath, "memory");
    let workspacePath = path.join(inputPath, "workspace");
    let archivePath = path.join(inputPath, "archive");

    let dbs = new DBs(
        new DB(memoryPath),
        new DB(path.join(memoryPath, "logs")),
        new DB(inputPath),
        new DB(workspacePath),
        new DB(path.resolve(__dirname, "preprompts")),
        new DB(archivePath)
    );

    if (stepsConfig !== StepsConfig.EXECUTE_ONLY && stepsConfig !== StepsConfig.USE_FEEDBACK && stepsConfig !== StepsConfig.EVALUATE) {
        archive(dbs);
    }
    console.log();
    

    let steps = STEPS[stepsConfig as keyof typeof STEPS];
    
    for (let step of steps) {
        let messages = await step(ai, dbs);
        dbs.logs.set(step.name, AI.serializeMessages(messages));
    }

    if (collectConsent()) {
        collectLearnings(model, temperature, steps, dbs);
    }

    dbs.logs.set("token_usage", ai.formatTokenUsageLog());
}

