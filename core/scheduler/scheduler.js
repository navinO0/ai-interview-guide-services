const cron = require('node-cron');
const fp = require('fastify-plugin'); // Fastify plugin helper

class CronScheduler {
    constructor(logger) {
        this.jobs = new Map();
        this.logger = logger; // Store the logger instance
    }

    /**
     * ✅ Schedule a cron job
     * @param {string} name - Unique job name
     * @param {string} schedule - Cron schedule pattern
     * @param {Function} task - Task function to execute
     */
    scheduleJob(name, schedule, task) {
        if (this.jobs.has(name)) {
            this.logger.warn(`Cron job "${name}" is already scheduled.`);
            return;
        }

        const job = cron.schedule(schedule, async () => {
            try {
                this.logger.info(`🕒 Running cron job: ${name}`);
                await task();
                this.logger.info(`✅ Cron job "${name}" completed.`);
            } catch (error) {
                this.logger.error(`❌ Error in cron job "${name}":`, error);
            }
        });

        this.jobs.set(name, job);
        this.logger.info(`📅 Scheduled cron job "${name}" with schedule: ${schedule}`);
    }

    /**
     * ✅ Stop a cron job
     * @param {string} name - Job name
     */
    stopJob(name) {
        if (this.jobs.has(name)) {
            this.jobs.get(name).stop();
            this.jobs.delete(name);
            this.logger.info(`Stopped cron job "${name}".`);
        } else {
            this.logger.warn(`Cron job "${name}" not found.`);
        }
    }

    /**
     * ✅ List all active jobs
     */
    listJobs() {
        return Array.from(this.jobs.keys());
    }
}

// ✅ Fastify plugin to register cron scheduler
async function cronPlugin(fastify, options) {
    fastify.decorate('cronScheduler', new CronScheduler(fastify.log));
}

module.exports = fp(cronPlugin);
