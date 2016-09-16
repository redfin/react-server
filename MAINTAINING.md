### Deployment Checklist

- `git checkout master && git pull upstream master`
- `npm config get registry`
    - Make sure it's `https://registry.npmjs.org/`
- `npm run clean`
- optionally: `npm run nuke && npm run bootstrap`
- `asini run prepublish`
- `npm test`
- `export GITHUB_AUTH="..."`
- `npm run changelog >> CHANGELOG.md`
- Edit `CHANGELOG.md`:
    - Move new entry to top
    - Put correct version in place of `Unreleased`
    - Remove private packages from headings
- `git add CHANGELOG.md`
- `asini publish`
    - If there are changes to READMEs, see `Publishing with README changes`
- Edit release tag on GitHub and paste the changelog entry in.

#### Publishing with README changes

Asini can't update READMEs on npmjs.com.  If we have a README change that we
want to show up there, then we need to publish by hand.  We can still let
Asini do most of the setup work for us, though:

- `asini publish --skip-npm`
- For each package: `npm publish packages/<package>`

### Updating annotated source code

- `git checkout gh-pages`
- `git rebase master`
- `npm run docs`
- `git add annotated-src`
- `git commit --amend`
- `git push -f upstream gh-pages`
