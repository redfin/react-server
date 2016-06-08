import test from 'ava';
import fs from 'fs';
import cp from 'child_process';
import path from 'path';

getTestCases().then((testCases) => {
  testCases.forEach((dir) => {
    test(`testing fixture in ${dir}`, async t => {
      await runGulp(dir);
      const expected = await readFile(path.join('fixtures', dir, 'expected.js'));
      const actual = await readFile(path.join('fixtures', dir, 'build', 'actual.js'));
    });
  });
});

function getTestCases() {
  return new Promise((resolve, reject) => {
    fs.readdir('fixtures', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    })
  })
}

function readFile(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function runGulp(dir) {
  return new Promise((resolve, reject) => {
    dir = path.join(__dirname, 'fixtures', dir);
    cp.exec('gulp', { cwd: dir }, (err, stdout, stderr) => {
      if (err) {
        console.error(stderr);
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}
