var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');

module.exports = yeoman.generators.Base.extend({
	prompting: function () {
		var done = this.async();

		this.log(yosay(
			'Welcome to the splendid ' + chalk.red('generator-reactserver') + ' generator!'
		));

		var prompts = [{
			type		: 'input',
			name		: 'name',
			message : 'What would you like to call your webapp?',
			default : this.appname,
		}];

		this.prompt(prompts, function (props) {
			this.props = props;

			done();
		}.bind(this));
	},

	writing: function () {
		var context = {
			name: this.props.name,
		}

		this.template('_babelrc', '.babelrc', context);
		this.template('_gitignore', '.gitignore', context);
		this.template('_package.json', 'package.json', context);
		this.template('_README.md', 'README.md', context);
		this.template('config.json', 'config.json', context);
		this.template('routes.js', 'routes.js', context);
		this.template('server.js', 'server.js', context);
		this.template('components/HelloWorld.js', 'components/HelloWorld.js', context);
		this.template('pages/Simple.js', 'pages/Simple.js', context);
	},

	install: function () {
		this.installDependencies();
	},
});
