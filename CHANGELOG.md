## v0.3.4 (2016-07-05)

#### Bug fix
* `react-server`
  * [#332](https://github.com/redfin/react-server/pull/332) Keep `document.location` up-to-date in frameback frame. ([@gigabo](https://github.com/gigabo))
  * [#330](https://github.com/redfin/react-server/pull/330) Wait for CSS to load on client transition. ([@gigabo](https://github.com/gigabo))

#### Commiters: 3
- Bo Borgerson ([gigabo](https://github.com/gigabo))
- Douglas Wade ([doug-wade](https://github.com/doug-wade))
- Greenkeeper ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))

## v0.3.3 (2016-06-30)

#### Enhancement
* `babel-plugin-react-server`, `babel-preset-react-server`
  * [#301](https://github.com/redfin/react-server/pull/301) Add babel module tagging. ([@doug-wade](https://github.com/doug-wade))
* `react-server-gulp-module-tagger`, `react-server-module-tagger`
  * [#300](https://github.com/redfin/react-server/pull/300) Add react server module tagger. ([@doug-wade](https://github.com/doug-wade))

#### Performance
* `react-server`
  * [#288](https://github.com/redfin/react-server/pull/288) Reduce nodeArrival calls by taking in range of node indices. ([@SteveVitali](https://github.com/SteveVitali))

#### Bug fix
* `babel-plugin-react-server`
  * [#322](https://github.com/redfin/react-server/pull/322) add dev dependency on babel-cli to babel plugin. ([@doug-wade](https://github.com/doug-wade))
* `react-server-cli`
  * [#318](https://github.com/redfin/react-server/pull/318) Downgrade webpack-dev-server to 1.13.0. ([@gigabo](https://github.com/gigabo))
* `generator-react-server`
  * [#298](https://github.com/redfin/react-server/pull/298) Validate project name in generator to ensure it's a valid npm package name. ([@latentflip](https://github.com/latentflip))

#### Security
* `react-server-cli`
  * [#308](https://github.com/redfin/react-server/pull/308) Resolve nsp 118 for react-server-cli. ([@doug-wade](https://github.com/doug-wade))
* `generator-react-server`
  * [#307](https://github.com/redfin/react-server/pull/307) Exempt nsp 120. ([@doug-wade](https://github.com/doug-wade))
* `react-server`
  * [#305](https://github.com/redfin/react-server/pull/305) Adding X-Content-Type-Options: nosniff header. ([@roblg](https://github.com/roblg))

#### Commiters: 6
- Bo Borgerson ([gigabo](https://github.com/gigabo))
- Douglas Wade ([doug-wade](https://github.com/doug-wade))
- Philip Roberts ([latentflip](https://github.com/latentflip))
- Robert Gay ([roblg](https://github.com/roblg))
- Sasha Aickin ([aickin](https://github.com/aickin))
- Steve Vitali ([SteveVitali](https://github.com/SteveVitali))

## v0.3.2 (2016-06-13)

#### Bug fix
* `react-server`
  * [#268](https://github.com/redfin/react-server/pull/268) Include URL fragment in history navigation stack pathnames. ([@gigabo](https://github.com/gigabo))

#### Enhancement
* `react-server-examples`
  * [#222](https://github.com/redfin/react-server/pull/222) Add bike share example. ([@doug-wade](https://github.com/doug-wade))

#### Performance
* `react-server`
  * [#274](https://github.com/redfin/react-server/pull/274) Clear failsafe timeouts on route/render success. ([@gigabo](https://github.com/gigabo))

#### Commiters: 3
- Bo Borgerson ([gigabo](https://github.com/gigabo))
- Carey Spies ([careylin](https://github.com/careylin))
- Douglas Wade ([doug-wade](https://github.com/doug-wade))

## v0.3.1 (2016-06-03)

#### Bug fix
* `react-server`
  * [#263](https://github.com/redfin/react-server/pull/263) Fixed: #261 - error response body needs to be rehydrated. ([@roblg](https://github.com/roblg))
* `generator-react-server`
  * [#257](https://github.com/redfin/react-server/pull/257) [255] .reactserverrc is malformed json. ([@doug-wade](https://github.com/doug-wade))
  * [#256](https://github.com/redfin/react-server/pull/256) [254] Generate gulpfile from template. ([@doug-wade](https://github.com/doug-wade))

#### Enhancement
* `react-server-cli`
  * [#251](https://github.com/redfin/react-server/pull/251) Handle image and font files linked from CSS. ([@aickin](https://github.com/aickin))

#### Commiters: 4
- Bo Borgerson ([gigabo](https://github.com/gigabo))
- Douglas Wade ([doug-wade](https://github.com/doug-wade))
- Robert Gay ([roblg](https://github.com/roblg))
- Sasha Aickin ([aickin](https://github.com/aickin))

## v0.3.0 (2016-06-02)

#### Breaking change
* `react-server-cli`
  * [#226](https://github.com/redfin/react-server/pull/226) Standardize routes file configuration (and rename `--routes` => `--routes-file`). ([@gigabo](https://github.com/gigabo))
* `react-server`
  * [#221](https://github.com/redfin/react-server/pull/221) Add new component: `<TheFold />`. ([@gigabo](https://github.com/gigabo))

#### Bug fix
* `react-server`
  * [#219](https://github.com/redfin/react-server/pull/219) Trim dangling root nodes with `reuseDom`. ([@gigabo](https://github.com/gigabo))
  * [#218](https://github.com/redfin/react-server/pull/218) Update root container attributes on `reuseDom` client transition. ([@gigabo](https://github.com/gigabo))
* `react-server-cli`
  * [#206](https://github.com/redfin/react-server/pull/206) Default options for cli overwrite config file options. ([@withinboredom](https://github.com/withinboredom))

#### Enhancement
* `generator-react-server`
  * [#213](https://github.com/redfin/react-server/pull/213) Add logger to yeoman generator. ([@doug-wade](https://github.com/doug-wade))
  * [#229](https://github.com/redfin/react-server/pull/229) Generate meta tags. ([@doug-wade](https://github.com/doug-wade))
  * [#231](https://github.com/redfin/react-server/pull/231) Add .reactserverrc to generator. ([@doug-wade](https://github.com/doug-wade))
  * [#200](https://github.com/redfin/react-server/pull/200) Add docker to yeoman generator. ([@withinboredom](https://github.com/withinboredom))
* `react-server`
  * [#221](https://github.com/redfin/react-server/pull/221) Add new component: `<TheFold />`. ([@gigabo](https://github.com/gigabo))
  * [#224](https://github.com/redfin/react-server/pull/224) Expose new convenience function: `navigateTo`. ([@gigabo](https://github.com/gigabo))
* `react-server-cli`
  * [#211](https://github.com/redfin/react-server/pull/211) Fixes [#103](https://github.com/redfin/react-server/issues/103): log NODE_ENV on startup. ([@doug-wade](https://github.com/doug-wade))

#### Commiters: 3
- Bo Borgerson ([gigabo](https://github.com/gigabo))
- Douglas Wade ([doug-wade](https://github.com/doug-wade))
- Rob Landers ([withinboredom](https://github.com/withinboredom))
