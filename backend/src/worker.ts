import { emailWorker } from './jobs/email.worker';
import { env } from './config/env';

console.log('Worker started...');
console.log(`Concurrency: ${env.CONCURRENCY}`);

emailWorker.on('completed', (job) => {
    console.log(`Job ${job.id} completed!`);
});

emailWorker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed: ${err.message}`);
});
