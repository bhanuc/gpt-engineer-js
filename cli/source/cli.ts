
import { Main } from './engineer/main.js';

(async () => {
    try {
        const app = await Main({ projectPath : "../projects/example"})
        console.log(app, "app");

    } catch (error: any) {
        console.log(error, 'err');
        
    } finally {
    }
})()