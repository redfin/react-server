### Dependencies

- `npm install -g rimraf`
- `npm install -g lerna`
- `npm install -g del-cli`

### Deployment Checklist

- `git checkout master && git pull upstream master`
- `npm config get registry`
    - Make sure it's `https://registry.npmjs.org/`
- `npm run clean`
- `npm run nuke && npm run bootstrap`
- `npm run lint`
- `npm run build`
- `npm test`
- `export GITHUB_AUTH="..."`
- `lerna version --no-push --no-changelog --no-git-tag-version`
- verify `packages/generator-react-server/generators/app/templates/package.json` has the
  correct versions of react-server packages
- `npm run changelog >> CHANGELOG.md`
- Edit `CHANGELOG.md`:
    - Move new entry to top
    - Put correct version in place of `Unreleased`
    - Remove private packages from headings
- `git commit -a -m "v<RELEASE>"`
- `git tag "v<RELEASE>"`
- `git push origin`
- `git push origin "v<RELEASE>"`
- `lerna publish from-git [--dist-tag prerelease]`
- Edit release tag on GitHub and paste the changelog entry in.

### Updating annotated source code

- `git checkout gh-pages`
- `git rebase master`
- `npm run docs`
- `git add annotated-src`
- `git commit --amend`
- `git push -f upstream gh-pages`

### Merging pull requests

As React Server is growing the number of contributers and maintainers, our policy around
merging pull requests needs to grow to accomodate.  Documentation changes and bug fixes
that include automated tests can be approved and merged by a single maintainer who is not
the author. All other changes must be approved by two maintainers (who are not the
author) prior to merging.
