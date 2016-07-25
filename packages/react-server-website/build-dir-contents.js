const fs = require('fs');
const path = require('path');

const contents = [];
const root = { name: 'root', pages: [] };
const gitignored = fs.readFileSync('.gitignore').toString().split('\n');

const data = fs.readdirSync('.');
data.forEach(fileish => {
	if (isDir(fileish) && !isGitIgnored(fileish)) {
		contents.push({ name: fileish, pages: getFiles(fileish) });
	} else if (isJsFile(fileish)) {
		root.pages.push({ name: fileish, path: fileish.replace('.js', '.html') });
	}
});

contents.push(root);
const str = JSON.stringify({contents: contents });
fs.writeFileSync('dir-contents.json', str);

function getFiles(fileish) {
	const files = [];
	const data = fs.readdirSync(fileish);
	data.forEach(datum => {
		let full = path.join(fileish, datum);
		if (isDir(full)) {
			let subFiles = getFiles(full);
			subFiles = subFiles.map(subFile => { return { name: subFile.path, path: subFile.path.replace('.js', '.html') } });
			files.concat(subFiles);
		} else if (isJsFile(full)) {
			files.push({ name: datum, path: datum.replace('.js', '.html') });
		}
	})
	return files;
}

function isDir(fileish) {
	return fs.lstatSync(fileish).isDirectory();
}

function isGitIgnored(fileish) {
	return gitignored.reduce((prev, curr) => {
		return prev || curr === fileish;
	}, false);
}

function isJsFile(fileish) {
	return path.extname(fileish) === '.js' && fs.lstatSync(fileish).isFile();
}
