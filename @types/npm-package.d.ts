type Person = {
	name: string;
	email: string;
}

export type Version = {
	author: Person
	contributors?: Person[];
	dependencies?: { [dependency: string]: string }
	deprecated?: string;
	description: string;
	devDependencies?: { [dependency: string]: string }
	directories?: { [directory: string]: string };
	dist: {
		shasum: string;
		tarball: string;
		fileCount?: number;
		integrity?: string;
		"npm-signature"?: string;
	}
	engines?: { [engine: string]: string };
	homepage?: string;
	keywords?: string[];
	license?: string;
	scripts?: { [script: string]: string };
	version: string
}

export type NPMPackageType = {
	author: Person
	bugs?: { url: string; }
	contributors?: Person[];
	description?: string;
	"dist-tags": { latest: string; next: string; }
	homepage?: string;
	keywords?: string[];
	license?: string;
	maintainers?: Person[];
	name: string;
	readme?: string;
	readmeFilename?: string;
	repository?: {
		type: string,
		url: string
	}
	time: { [version: string]: string };
	versions: { [version: string]: Version }
}

export default NPMPackageType;
