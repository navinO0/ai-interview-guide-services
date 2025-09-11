const { serverSetup, getAllRoutes } = require('./server');
const path = require('path');
require('events').EventEmitter.defaultMaxListeners = 30;
const CONFIG = require('./core/config');

const PORT = CONFIG.PORT;

const urlPrefix = "/users";


(async () => {
    try {
        const parentDirs = ["ai-interview"];
        const server = await serverSetup(urlPrefix); // Initialize server before using it

        // Using for...of to handle async properly
        for (const parentDir of parentDirs) {
            let parentDirectory = path.resolve(__dirname, `./${parentDir}`);
            const routes = getAllRoutes(parentDirectory);
            for (const element of routes) {
                const route = require(element);
                server.register(route);
            }
        }

        // Start the server
        await server.listen({ port: PORT, host: CONFIG.HOST })
            .then((address) => {
                console.log("Everything is Loaded..!");
                console.log(
                    "Swagger URL: " + address + urlPrefix + "swagger/public/documentation"
                );
                console.log(
                    "Check server status URL: " + address + urlPrefix + "/public/status"
                );
            })
            .catch((err) => {
                throw new Error("Failed to start the server.", err);
            });

    } catch (err) {
        console.error('Error occurred:', err); 
        process.exit(1);
    }
})();





