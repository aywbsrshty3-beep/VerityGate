/**
 * npx ts-node .\src\Hephaestus\pe\HephaestusControls.ts   
 */

import logger from './logger';
import { openConnection } from "./HephaestusDB";
import { Client } from 'pg';

async function monitorJobs(client: Client): Promise<void> {
    logger.info('Monitoring controls ...');   
}

async function main() {
    logger.info('Starting Hephaestus Controls Monitoring...');
    const client = await openConnection();
    while (true) {
        monitorJobs(client);
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

main();
