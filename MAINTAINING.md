### Deployment Checklist

- `npm run clean`
- `npm test`
- `npm run changelog >> CHANGELOG.md`
- Edit `CHANGELOG.md`:
    - Move new entry to top
    - Put correct version in place of `Unreleased`
    - Remove [private packages](https://github.com/lerna/lerna-changelog/issues/15) from headings
- `git add CHANGELOG.md`
- `npm run publish`
    - If there are changes to READMEs, see `Publishing with README changes`
- Edit release tag on GitHub and paste the changelog entry in.

#### Publishing with README changes

Lerna [can't update READMEs](https://github.com/lerna/lerna/issues/64) on
npmjs.com.  If we have a README change that we want to show up there, then we
need to publish by hand.  We can still let Lerna do most of the setup work for
us, though:

- `npm run publish -- --skip-npm`
- For each package: `npm publish packages/<package>`
