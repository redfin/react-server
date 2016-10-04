var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var validatePackageName = require('validate-npm-package-name');

module.exports = yeoman.Base.extend({
	prompting: function () {
		this.log(yosay(
			'Welcome to the shining ' + chalk.red('generator-react-server') + ' generator!'
		));

		var prompts = [{
			type: 'input',
			name: 'name',
			message: 'What would you like to call your app?',
			default: this.appname.trim().replace(/\s+/g, '-'),
			validate: function (name) {
				var validation = validatePackageName(name);
				var warnings = validation.warnings || [];
				var errors = validation.errors || [];

				if (validation.validForNewPackages) {
					return true;
				}

				return warnings.concat(errors).join('\n');
			},
		}, {
			type: 'confirm',
			name: 'dockerCfg',
			message: 'Do you want to generate a Docker file and Docker Compose file?',
			default: false,
		}];

		return this.prompt(prompts).then(function (props) {
			this.props = props;
		}.bind(this));
	},

	writing: function () {
		var _this = this;

		[
			'_nsprc',
			'_babelrc',
			'_eslintrc',
			'_gitignore',
			'_reactserverrc',
		].forEach(function (filename) {
			var fn = filename.replace('_', '.');
			_this.fs.copyTpl(
				_this.templatePath(filename),
				_this.destinationPath(fn),
				_this.props
			);
		});

		var files = [
			'pages/hello-world.js',
			'components/hello-world.js',
			'package.json',
			'README.md',
			'routes.json',
			'test.js',
		];

		if (this.props.dockerCfg) {
			files.push('Dockerfile');
			files.push('docker-compose.yml');
		}

		files.forEach(function (filename) {
			_this.fs.copyTpl(
				_this.templatePath(filename),
				_this.destinationPath(filename),
				_this.props
			);
		});
	},

	install: function () {
		this.npmInstall();
	},
});
