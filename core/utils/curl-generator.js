const generateCurlCommand = (request) => {
    let curl = `curl --location --request ${request.method} '${request.protocol}://${request.hostname}${request.url}'`;

    // Add headers
    if (request.headers) {
        Object.keys(request.headers).forEach(key => {
            if (key !== 'content-length') { // Content-length is automatically added by curl
                curl += ` \\\n--header '${key}: ${request.headers[key]}'`;
            }
        });
    }

    // Add body if present
    if (request.body && Object.keys(request.body).length > 0) {
        try {
             // Check content type to decide how to format body (JSON vs form) - failing back to JSON for now as it's most common
            curl += ` \\\n--data-raw '${JSON.stringify(request.body)}'`;
        } catch (e) {
            // If body is not stringifiable, ignore or handle specifically
        }
    }

    return curl;
};

module.exports = { generateCurlCommand };
