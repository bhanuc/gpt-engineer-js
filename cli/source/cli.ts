#!/usr/bin/env node

import { Main } from './engineer/main.js';

(async () => {
    try {
        const app = await Main({ projectPath : process.cwd()})
        console.log(app, "app");

    } catch (error: any) {
        console.log(error, 'err');
        
    } finally {
    }
})()