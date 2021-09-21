/**
 * @name        Build-Graph-for-NPM-with-Graphviz
 * @summary     Give package name, get its dependencies in a fancy way
 * @author      serguun42
 */


const fs =          require("fs");
const util =        require("util");
const fsWriteFile = util.promisify(fs.writeFile);
const fsStat =      util.promisify(fs.stat);
const fsMkdir =     util.promisify(fs.mkdir);
const path =        require("path");
const semver =      require("semver");
const axios =       require("axios").default;
const readline =    require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
});



const REGISTRY_BASE_URL = `https://registry.npmjs.org/`;

/**
 * @param {string} packageName
 * @returns {string}
 */
const PACKAGE_URL = (packageName) => new URL(packageName, REGISTRY_BASE_URL).href;


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


/**
 * @callback GetterCallback
 * Recursive package-fetcher and set-builder
 * 
 * @param {string} packageName
 * @param {string} [packageVersionRequired]
 * @returns {Promise<import("./@types/building-graph").BuildingGraph>}
 */
/** @type {GetterCallback} */
function GetPackage(packageName, packageVersionRequired) {
    if (/^(none|exit)$/i.test(packageName)) return process.exit(0);

    console.log(`Fetching <packageName = ${packageName}>, <packageVersionRequired = ${packageVersionRequired || "any"}>`);

    return axios.get(PACKAGE_URL(packageName))
    .then((res) => {
        if (res.status >= 300)
            return Promise.reject(`Status code ${res.status} ${res.statusText}`);


        /** @type {import("./@types/npm-package").NPMPackageType} */
        const packageData = res.data;


        /**
         * Get latest version tag or latest stable version
         */
        const latestVersionName = packageData["dist-tags"]?.latest
                                  ||
                                  Object.keys(packageData.versions)
                                  .filter((ver) => /^\d+\.\d+(\.\d+)?$/.test(ver))
                                  .pop();

        if (!latestVersionName) return {};


        /**
         * If `packageVersionRequired` is passed and chosen version is exists
         *  – get some version that SATISFY PASSED one.
         * If `packageVersionRequired` is not passed or chosen version is not present
         *  – get latest instead.
         */
        const properVersionName = Object.keys(packageData.versions)
                                  .filter((ver) => semver.satisfies(ver, packageVersionRequired || latestVersionName))
                                  .pop();

        if (!properVersionName) return {};

        
        const properVersionDoc = packageData.versions[properVersionName];

        if (!properVersionDoc) return {};


        /** @type {import("./@types/building-graph").BuildingGraph} */
        const currentGraphPart = {};

        if (!currentGraphPart[packageName])
            currentGraphPart[packageName] = new Set();


        return Promise.all(Object.keys(properVersionDoc.dependencies || []).map((dependencyName) => {
            currentGraphPart[packageName].add(dependencyName);

            const dependencyVersion = properVersionDoc.dependencies[dependencyName];
            if (!dependencyVersion) return Promise.resolve({});

            return FetcherWrapper(dependencyName, dependencyVersion)
            .then((dependencyGraphPart) => {
                Object.keys(dependencyGraphPart).forEach((subPackageName) => {
                    if (currentGraphPart[subPackageName])
                        currentGraphPart[subPackageName] = new Set([ 
                            ...currentGraphPart[subPackageName],
                            ...dependencyGraphPart[subPackageName]
                        ]);
                    else
                        currentGraphPart[subPackageName] = dependencyGraphPart[subPackageName];
                });

                Promise.resolve(dependencyGraphPart);
            })
            .catch((e) => {
                console.warn(e);
                
                return Promise.resolve({});
            });
        }))
        .then(() => Promise.resolve(currentGraphPart));
    })
    .catch((e) => {
        console.warn(`Cannot get info about <packageName = ${packageName}> <packageVersionRequired = ${packageVersionRequired}>\n`, e);

        return Promise.resolve({});
    });
}


let queue = 0;

/** @type {GetterCallback} */
const FetcherWrapper = (...args) => new Promise((resolve, reject) => {
    setTimeout(() => {
        --queue;
        
        GetPackage(...args)
        .then(resolve)
        .catch(reject);
    }, ++queue * 50)
});


(process.argv[2] ? Promise.resolve(process.argv[2]) : Ask("What NPM package you would like to inspect? "))
.then((packageName) => {
    FetcherWrapper(packageName)
    .then((buildingGraph) => {
        const filteredGraphLayout = Object.keys(buildingGraph).map((parentPackageName) => {
            return Array.from(buildingGraph[parentPackageName])
                   .map((childPackageName) => `\t"${parentPackageName}" -> "${childPackageName}";`)
                   .join("\n");
        })
        .filter((line, index, layout) => index === layout.indexOf(line))
        .join("\n");


        const betterPackageName = packageName.replace(/\W/g, "");
        const finalLayout = `digraph ${betterPackageName} {\n${filteredGraphLayout}\n}`.replace(/\n+/g, "\n");


        console.clear();

        return Ask(`Program needs to write result to folder "result", next to this executable. It will contain file:\n\t* ${betterPackageName}.graphviz.dot\n\nType (y)es to proceed> `)
        .then((answer) => {
            if (!/^y(es)?$/i.test(answer)) {
                console.log("Aborting…");
                return Promise.resolve();
            }

            fsStat(path.join(__dirname, "result"))
            .then((stats) => {
                if (stats.isDirectory())
                    return Promise.resolve();

                console.warn(`${path.join(__dirname, "result")} is present and it's not a dir!`);
            })
            .catch(() => fsMkdir(path.join(__dirname, "result")))
            .then(() => fsWriteFile(path.join(__dirname, "result", `${betterPackageName}.graphviz.dot`), finalLayout))
            .then(() => console.log(`File saved into ${path.join(__dirname, "result")}`))
        });
    })
    .catch(console.warn)
    .finally(() => readline.close());
});
