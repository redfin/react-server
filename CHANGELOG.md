## v0.4.9 (2016-10-06)

#### Bug fix
* `react-server-examples`
  * [#697](https://github.com/redfin/react-server/pull/697) Update or add .reactserverrc files. ([@sresant](https://github.com/sresant))
* `react-server-cli`
  * [#695](https://github.com/redfin/react-server/pull/695) Remove default routes file. ([@sresant](https://github.com/sresant))

#### Commiters: 1
- Sresan Thevarajah ([sresant](https://github.com/sresant))

## v0.4.8 (2016-10-05)

#### Enhancement
* `react-server`
  * [#659](https://github.com/redfin/react-server/pull/659) Moved call to set the page on the response logger from. ([@vinsewah](https://github.com/vinsewah))
  * [#642](https://github.com/redfin/react-server/pull/642) Adding http response header hook to page lifecyle. ([@nampas](https://github.com/nampas))
  * [#626](https://github.com/redfin/react-server/pull/626) Rebased sjv improve error logging. ([@lidawang](https://github.com/lidawang))

#### Bug fix
* `generator-react-server`, `react-server-cli`
  * [#691](https://github.com/redfin/react-server/pull/691) Fix inconsistent usage of routes.js vs. routes.json. ([@sresant](https://github.com/sresant))
* `react-server-cli`
  * [#665](https://github.com/redfin/react-server/pull/665) resolves #664. ([@SeverS](https://github.com/SeverS))
  * [#644](https://github.com/redfin/react-server/pull/644) Normalize httpsOptions from parseCli. ([@jbenesch](https://github.com/jbenesch))
* `react-server`
  * [#677](https://github.com/redfin/react-server/pull/677) Prevent "when" childProps from clobbering "listen" chlidProps in RootElement. ([@TonyHYK](https://github.com/TonyHYK))
* `babel-preset-react-server`
  * [#637](https://github.com/redfin/react-server/pull/637) Add babel-runtime to babel-preset-react-server. ([@doug-wade](https://github.com/doug-wade))
* Other
  * [#668](https://github.com/redfin/react-server/pull/668) Fix react-server issue with npm2. ([@sresant](https://github.com/sresant))

#### Security
* `react-server-cli`
  * [#684](https://github.com/redfin/react-server/pull/684) Remove outdated nsp exemption. ([@doug-wade](https://github.com/doug-wade))
* `generator-react-server`
  * [#685](https://github.com/redfin/react-server/pull/685) Remove outdated nsp exemptions. ([@doug-wade](https://github.com/doug-wade))
* `generator-react-server`, `react-server`
  * [#682](https://github.com/redfin/react-server/pull/682) Fix the build. ([@doug-wade](https://github.com/doug-wade))

#### Commiters: 12
- Alan Bares ([alanbares](https://github.com/alanbares))
- Bo Borgerson ([gigabo](https://github.com/gigabo))
- Douglas Wade ([doug-wade](https://github.com/doug-wade))
- Greenkeeper ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- Henry Zhu ([hzhu](https://github.com/hzhu))
- Jason Benesch ([jbenesch](https://github.com/jbenesch))
- Lida Wang ([lidawang](https://github.com/lidawang))
- Nathan Pastor ([nampas](https://github.com/nampas))
- Sever Abibula ([SeverS](https://github.com/SeverS))
- Sresan Thevarajah ([sresant](https://github.com/sresant))
- Tony Hung ([TonyHYK](https://github.com/TonyHYK))
- Vince Chang ([vinsewah](https://github.com/vinsewah))

## v0.4.7 (2016-08-27)

#### Enhancement
* `react-server-cli`
  * [#598](https://github.com/redfin/react-server/pull/598) Webpack config. ([@hbussell](https://github.com/hbussell))
  * [#631](https://github.com/redfin/react-server/pull/631) Export default options so other dependent packages can test against changing properties. ([@jbenesch](https://github.com/jbenesch))
  * [#592](https://github.com/redfin/react-server/pull/592) Add version flag to react-server-cli. ([@doug-wade](https://github.com/doug-wade))
  * [#630](https://github.com/redfin/react-server/pull/630) Make superagent a regular dependency and upgrade to 2.2.0. ([@doug-wade](https://github.com/doug-wade))
* `react-server`
  * [#610](https://github.com/redfin/react-server/pull/610) Implement toJson on ReactServerAgent request for logging/debugging. ([@doug-wade](https://github.com/doug-wade))
  * [#606](https://github.com/redfin/react-server/pull/606) Update react-server to write server side timings/logs to the response document. ([@vinsewah](https://github.com/vinsewah))
  * [#617](https://github.com/redfin/react-server/pull/617) Updating the dependency on request-local-storage from 1.0.0 to 1.1.0. ([@vinsewah](https://github.com/vinsewah))
  * [#616](https://github.com/redfin/react-server/pull/616) Emit showMaster event when the back navigation is triggered in Frameback. ([@vinsewah](https://github.com/vinsewah))
* `babel-plugin-react-server`, `react-server-gulp-module-tagger`, `react-server-module-tagger`
  * [#611](https://github.com/redfin/react-server/pull/611) Prepend configurable prefix to module tag. ([@doug-wade](https://github.com/doug-wade))

#### Bug fix
* `generator-react-server`
  * [#625](https://github.com/redfin/react-server/pull/625) Ensure generated .reactserverrc option keys match cli option keys. ([@jbenesch](https://github.com/jbenesch))
  * [#601](https://github.com/redfin/react-server/pull/601) Fix 599: use path.join instead of string concatenation. ([@doug-wade](https://github.com/doug-wade))
* `react-server-data-bundle-cache`
  * [#603](https://github.com/redfin/react-server/pull/603) Fix react-server-data-bundle-cache logging. ([@doug-wade](https://github.com/doug-wade))
* `react-server`
  * [#602](https://github.com/redfin/react-server/pull/602) Fix module tagging for react server core. ([@doug-wade](https://github.com/doug-wade))

#### Commiters: 8
- Carey Spies ([careylin](https://github.com/careylin))
- David Alber ([davidalber](https://github.com/davidalber))
- Douglas Wade ([doug-wade](https://github.com/doug-wade))
- Greenkeeper ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- Harley Bussell ([hbussell](https://github.com/hbussell))
- Henry Zhu ([hzhu](https://github.com/hzhu))
- Jason Benesch ([jbenesch](https://github.com/jbenesch))
- Vince Chang ([vinsewah](https://github.com/vinsewah))

## v0.4.6 (2016-08-23)

#### Enhancement
* `react-server-cli`
  * [#592](https://github.com/redfin/react-server/pull/592) Add version flag to react-server-cli. ([@doug-wade](https://github.com/doug-wade))

#### Bug fix
* `react-server`
  * [#602](https://github.com/redfin/react-server/pull/602) Fix module tagging for react server core. ([@doug-wade](https://github.com/doug-wade))
* `generator-react-server`
  * [#601](https://github.com/redfin/react-server/pull/601) Fix 599: use path.join instead of string concatenation. ([@doug-wade](https://github.com/doug-wade))

#### Commiters: 2
- Carey Spies ([careylin](https://github.com/careylin))
- Douglas Wade ([doug-wade](https://github.com/doug-wade))

## v0.4.5 (2016-08-18)

#### Enhancement
* `react-server`
  * [#587](https://github.com/redfin/react-server/pull/587) Fire a "pageview" event from the client controller. ([@gigabo](https://github.com/gigabo))
* `react-server-cli`
  * [#581](https://github.com/redfin/react-server/pull/581) Better module lookup during client compilation. ([@gigabo](https://github.com/gigabo))
* `react-server-gulp-module-tagger`
  * [#561](https://github.com/redfin/react-server/pull/561) Fixes [#12](https://github.com/redfin/react-server/issues/12) Support configurable tokens for the gulp module tagger. ([@doug-wade](https://github.com/doug-wade))

#### Bug fix
* `react-server-cli`
  * [#583](https://github.com/redfin/react-server/pull/583) Fix react-server-cli module tags. ([@doug-wade](https://github.com/doug-wade))

#### Commiters: 4
- Bo Borgerson ([gigabo](https://github.com/gigabo))
- David Alber ([davidalber](https://github.com/davidalber))
- Douglas Wade ([doug-wade](https://github.com/doug-wade))
- Greenkeeper ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))

## v0.4.4 (2016-08-17)

#### Enhancement
* `react-server-cli`
  * [#579](https://github.com/redfin/react-server/pull/579) Add .sass support. ([@alex88](https://github.com/alex88))
* `react-server`
  * [#573](https://github.com/redfin/react-server/pull/573) Add support to Link for href. ([@doug-wade](https://github.com/doug-wade))

#### Bug fix
* `react-server-cli`
  * [#568](https://github.com/redfin/react-server/pull/568) Fixed bug in https handling. ([@CreepGin](https://github.com/CreepGin))
* `react-server-examples`
  * [#550](https://github.com/redfin/react-server/pull/550) Updated bike-share example. ([@hzhu](https://github.com/hzhu))
  * [#557](https://github.com/redfin/react-server/pull/557) #555 update hello world to lastest react server and cli. ([@doug-wade](https://github.com/doug-wade))

#### Commiters: 8
- Alessandro Tagliapietra ([alex88](https://github.com/alex88))
- Amila Welihinda ([amilajack](https://github.com/amilajack))
- Bo Borgerson ([gigabo](https://github.com/gigabo))
- David ([CreepGin](https://github.com/CreepGin))
- David Alber ([davidalber](https://github.com/davidalber))
- Douglas Wade ([doug-wade](https://github.com/doug-wade))
- Greenkeeper ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- Henry Zhu ([hzhu](https://github.com/hzhu))

## v0.4.3 (2016-08-12)

#### Enhancement
* `react-server-cli`
  * [#543](https://github.com/redfin/react-server/pull/543) Add sass support. ([@gigabo](https://github.com/gigabo))

#### Bug fix
* `react-server-cli`
  * [#528](https://github.com/redfin/react-server/pull/528) Don't require node 6 to run react-server-cli. ([@lidawang](https://github.com/lidawang))
  * [#523](https://github.com/redfin/react-server/pull/523) Declare chalk dependency. ([@doug-wade](https://github.com/doug-wade))
  * [#533](https://github.com/redfin/react-server/pull/533) Don't require CLI users to install webpack locally. ([@gigabo](https://github.com/gigabo))

#### Commiters: 7
- Bo Borgerson ([gigabo](https://github.com/gigabo))
- Dharam Gollapudi ([dharamgollapudi](https://github.com/dharamgollapudi))
- Douglas Wade ([doug-wade](https://github.com/doug-wade))
- Eric Gideon ([egid](https://github.com/egid))
- Greenkeeper ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- Lida Wang ([lidawang](https://github.com/lidawang))
- nattofriends ([nattofriends](https://github.com/nattofriends))

## v0.4.2 (2016-08-10)

#### Enhancement
* `react-server-cli`
  * [#513](https://github.com/redfin/react-server/pull/513) add body-parser middleware for express. ([@mattiasewers](https://github.com/mattiasewers))

#### Bug fix
* `react-server`
  * [#501](https://github.com/redfin/react-server/pull/501) Prevent another type of flash of unstyled content. ([@gigabo](https://github.com/gigabo))
  * [#518](https://github.com/redfin/react-server/pull/518) Eliminate a frameback navigation initialization race. ([@gigabo](https://github.com/gigabo))

#### Commiters: 6
- Bo Borgerson ([gigabo](https://github.com/gigabo))
- David Alber ([davidalber](https://github.com/davidalber))
- Douglas Wade ([doug-wade](https://github.com/doug-wade))
- Greenkeeper ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- Mattias Ewers ([mattiasewers](https://github.com/mattiasewers))
- Omer Zach ([omerzach](https://github.com/omerzach))

## v0.4.1 (2016-08-04)

#### Enhancement
* `generator-react-server`, `react-server-cli`, `react-server`
  * [#490](https://github.com/redfin/react-server/pull/490) Cli commands. ([@gigabo](https://github.com/gigabo))
* `react-server`
  * [#481](https://github.com/redfin/react-server/pull/481) Add debug params for log level adjustment in browser. ([@gigabo](https://github.com/gigabo))
* `generator-react-server`, `react-server-cli`
  * [#484](https://github.com/redfin/react-server/pull/484) Make `react-server-cli` work as a global install. ([@gigabo](https://github.com/gigabo))

#### Bug fix
* `react-server`
  * [#500](https://github.com/redfin/react-server/pull/500) Address a flash of unstyled content on the website. ([@gigabo](https://github.com/gigabo))
* `react-server-cli`
  * [#460](https://github.com/redfin/react-server/pull/460) Just don't mess with `resolve.root` at all. ([@gigabo](https://github.com/gigabo))
  * [#458](https://github.com/redfin/react-server/pull/458) Tell webpack to look for _our_ deps first. ([@gigabo](https://github.com/gigabo))
  * [#373](https://github.com/redfin/react-server/pull/373) Ensure that if `common` exists in the manifest, we include it.. ([@egid](https://github.com/egid))

#### Commiters: 7
- Bo Borgerson ([gigabo](https://github.com/gigabo))
- David Alber ([davidalber](https://github.com/davidalber))
- Douglas Wade ([doug-wade](https://github.com/doug-wade))
- Eric Gideon ([egid](https://github.com/egid))
- Greenkeeper ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- Perry Shuman ([Noirbot](https://github.com/Noirbot))
- Tim Duffey ([decoy31](https://github.com/decoy31))

## v0.4.0 (2016-07-16)

#### Enhancement
* `react-server-cli`
  * [#302](https://github.com/redfin/react-server/pull/302) Use babel preset to build react-server-cli. ([@doug-wade](https://github.com/doug-wade))
  * [#343](https://github.com/redfin/react-server/pull/343) Add react-server-cli watch mode. ([@doug-wade](https://github.com/doug-wade))
  * [#348](https://github.com/redfin/react-server/pull/348) Add json loader to webpack. ([@doug-wade](https://github.com/doug-wade))

#### Commiters: 2
- Douglas Wade ([doug-wade](https://github.com/doug-wade))
- Greenkeeper ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))

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
