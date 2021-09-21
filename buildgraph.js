/**
 * @name        Build-Graph-for-NPM-with-Graphviz
 * @summary     Give package name, get its dependencies in a fancy way
 * @author      serguun42
 */


const fs =          require("fs");
const fetch =       require("node-fetch");
const path =        require("path");
const readline =    require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
});



/**
 * @param {string} package
 * @returns {URL}
 */
const REGISTRY_BASE_URL = (package) => new URL(package, `https://registry.npmjs.org/`);


/**
 * Handler for prompting
 * 
 * @param {string} question One's to be prompted
 * @returns {Promise<string>}
 */
function Ask(question) {
    return new Promise((resolve) =>
        readline.question(question, (answer) =>
            resolve(answer?.trim?.() || "")
        )
    );
}


Ask("What NPM package you would like to inspect (type `none` to exit)? ")
.then((packageName) => {
    if (/^(none|exit)$/i.test(packageName)) return process.exit(0);

    fetch
    
    console.log({ packageName });
});
