import gulp from "gulp";
import fs from "fs-extra";
import path from "path";
import archiver from "archiver";
import less from "gulp-less";

function getManifest() {
	const json = {
		root: 'src'
	};

	const systemPath = path.join(json.root, 'system.json');

	if (fs.existsSync(systemPath)) {
		json.file = fs.readJSONSync(systemPath);
		json.name = 'system.json';
	} else {
		return;
	}

	return json;
}

/********************/
/*		BUILD		*/
/********************/

/**
 * Build Less
 */
function buildLess() {
	return gulp.src('src/*.less').pipe(less()).pipe(gulp.dest('dist'));
}

/**
 * Copy static files
 */
async function copyFiles() {
	const statics = [
		'lang',
		'fonts',
		'images',
		'templates',
		'module',
		'mwii.js',
		'system.json',
		'template.json',
	];
	try {
		for (const file of statics) {
			if (fs.existsSync(path.join('src', file))) {
				await fs.copy(path.join('src', file), path.join('dist', file));
			}
		}
		return Promise.resolve();
	} catch (err) {
		Promise.reject(err);
	}
}

/**
 * Does the same as copyFiles, except it only moves the 
 * README and LICENSE files. These aren't needed for
 * development, but they should be in the package.
 */
async function copyReadmeAndLicenses() {
	const statics = ["README.md", "LICENSE"];

	try {
		for (const file of statics) {
			if (fs.existsSync(file)) {
				await fs.copy(file, path.join('dist', file));
			}
		}

		return Promise.resolve();
	} catch (err) {
		Promise.reject(err);
	}
}

/**
 * Watch for changes for each build step
 */
function buildWatch() {
	gulp.watch('src/**/*.less', { ignoreInitial: false }, buildLess);
	gulp.watch(
		['src/fonts', 'src/lang', 'src/templates', 'src/*.json', 'src/**/*.js'],
		{ ignoreInitial: false },
		copyFiles
	);
}

export async function copyLocalization() {
	console.log("Opening localization files");
	const englishFilePath = "./src/lang/en.json";
	const englishRaw = await fs.readFile(englishFilePath);
	const englishJson = JSON.parse(englishRaw);

	const itemSourceDir = "./src/lang";
	const files = await fs.readdir(itemSourceDir);
	for (const filePath of files) {
		if (filePath.includes("en.json")) {
			continue;
		}

		console.log(`Processing ${filePath}`);
		const fileRaw = await fs.readFile(path.join([itemSourceDir, filePath]));
		const fileJson = JSON.parse(fileRaw);

		let copiedJson = JSON.parse(JSON.stringify(englishJson));
		mergeDeep(copiedJson, fileJson);

		const outRaw = JSON.stringify(copiedJson, null, 4);
		await fs.writeFile(path.join([itemSourceDir, filePath]), outRaw);
		
	}
}

function isObject(item) {
	return (item && typeof item === 'object' && !Array.isArray(item));
}

function mergeDeep(target, ...sources) {
	if (!sources.length) return target;
	const source = sources.shift();

	if (isObject(target) && isObject(source)) {
		for (const key in source) {
			if (isObject(source[key])) {
				if (!target[key]) Object.assign(target, { [key]: {} });
				mergeDeep(target[key], source[key]);
			} else {
				Object.assign(target, { [key]: source[key] });
			}
		}
	}

	return mergeDeep(target, ...sources);
}

/********************/
/*		CLEAN		*/
/********************/

/**
 * Remove built files from `dist` folder
 * while ignoring source files
 */
export async function clean() {
	const name = 'mwii';
	const files = [];
	
	files.push(
		'lang',
		'templates',
		'module',
		'fonts',
		'images',
		'packs',
		'styles',
		`${name}.js`,
		`${name}.css`,
		'system.json',
		'template.json',
		'README.md',
		'LICENSE'
	);

	console.log(' ', 'Files to clean:');
	console.log('   ', files.join('\n    '));

	// Attempt to remove the files
	try {
		for (const filePath of files) {
			await fs.remove(path.join('dist', filePath));
		}
		return Promise.resolve();
	} catch (err) {
		Promise.reject(err);
	}
}

/********************/
/*		LINK		*/
/********************/

/**
 * Link build to User Data folder
 */
async function linkUserData() {
	const name = path.basename(path.resolve('.'));
	const config = fs.readJSONSync('foundryconfig.json');

	let destDir;
	try {
		if (
			fs.existsSync(path.resolve('.', 'dist', 'module.json')) ||
			fs.existsSync(path.resolve('.', 'src', 'module.json'))
		) {
			destDir = 'modules';
		} else if (
			fs.existsSync(path.resolve('.', 'dist', 'system.json')) ||
			fs.existsSync(path.resolve('.', 'src', 'system.json'))
		) {
			destDir = 'systems';
		} else {
			throw Error(
				`Could not find 'module.json' or 'system.json'`
			);
		}

		let linkDir;
		if (config.dataPath) {
			if (!fs.existsSync(path.join(config.dataPath, 'Data')))
				throw Error('User Data path invalid, no Data directory found');

			linkDir = path.join(config.dataPath, 'Data', destDir, name);
		} else {
			throw Error('No User Data path defined in foundryconfig.json');
		}

		if (!fs.existsSync(linkDir)) {
			console.log(
				`Copying build to ${linkDir}`
			);
			await fs.symlink(path.resolve('./dist'), linkDir);
		}
		return Promise.resolve();
	} catch (err) {
		Promise.reject(err);
	}
}

/*********************/
/*		PACKAGE		 */
/*********************/

/**
 * Package build
 */
async function packageBuild() {
	const manifest = getManifest();

	return new Promise((resolve, reject) => {
		try {
			// Ensure there is a directory to hold all the packaged versions
			fs.ensureDirSync('package');

			// Initialize the zip file
			const zipName = `${manifest.file.name}-v${manifest.file.version}.zip`;
			const zipFile = fs.createWriteStream(path.join('package', zipName));
			const zip = archiver('zip', { zlib: { level: 9 } });

			zipFile.on('close', () => {
				console.log(zip.pointer() + ' total bytes');
				console.log(
					`Zip file ${zipName} has been written`
				);
				return resolve();
			});

			zip.on('error', (err) => {
				throw err;
			});

			zip.pipe(zipFile);

			// Add the directory with the final code
			zip.directory('dist/', manifest.file.name);

			zip.finalize();
		} catch (err) {
			return reject(err);
		}
	});
}

const execBuild = gulp.parallel(buildLess, copyFiles);

const build = gulp.series(clean, execBuild);
const watch = buildWatch;
const link = linkUserData;
const _package = gulp.series(copyReadmeAndLicenses, packageBuild);
const _default = build;

export { 
	_default as default, 
	_package as package,
	build,
	watch,
	link
};
