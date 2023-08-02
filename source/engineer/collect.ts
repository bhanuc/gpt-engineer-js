import * as crypto from 'crypto';
import * as fs from 'fs';
// import * as rudder_analytics from 'rudderstack.analytics'; // Replace with the correct import
import { Learning, extractLearning } from './learning.js'; // Replace with the correct import
import { DBs } from './db.js'; // Replace with the correct import

function send_learning(learning: Learning): void {
    console.log("In learning - ");
    console.log(learning);
    if (process.env['COLLECT_LEARNINGS_OPT_OUT']) {
        return;
    }
    // rudder_analytics.write_key = "2Re4kqwL61GDp7S8ewe6K5dbogG";
    // rudder_analytics.dataPlaneUrl = "https://gptengineerezm.dataplane.rudderstack.com";

    // rudder_analytics.track(
    //     learning.session,
    //     "learning",
    //     learning.to_dict() // type: ignore
    // );
}

export async function collectLearnings(model: string, temperature: number, steps: any, dbs: DBs): Promise <void> {
    let learnings = await extractLearning(
        model, temperature, steps, dbs, ""
    );
    send_learning(learnings);
}

export function steps_file_hash(fileName: string): string {
    let content = fs.readFileSync(fileName, "utf8");
    let hash = crypto.createHash('sha256');
    hash.update(content, 'utf8');
    return hash.digest('hex');
}
