import "./colors/red.scss";
import "./colors/blue.scss";
import "./colors/purple.scss";
import "./colors/green.scss";
import "./colors/orange.scss";
import "./colors/indigo.scss";
import "./colors/yellow.scss";

const RedThing = () => <div className="red-thing">This should be red</div>;
const BlueThing = () => <div className="blue-thing">This should be blue</div>;
const PurpleThing = () => <div className="purple-thing">This should be purple</div>;
const GreenThing = () => <div className="green-thing">This should be green</div>;
const OrangeThing = () => <div className="orange-thing">This should be orange</div>;
const IndigoThing = () => <div className="indigo-thing">This should be indigo</div>;
const YellowThing = () => <div className="yellow-thing">This should be yellow</div>;
const ColorWheel = [RedThing(), BlueThing(), PurpleThing(), GreenThing(),
	OrangeThing(), IndigoThing(), YellowThing()];
const ColorSize = ColorWheel.length;

/**
* This page is a smoke test to determine whether or not the number of elements in
* a page is a performance bottleneck for react-server. It returns a huge assortment of
* randomly generated color-coded elements. Metrics are created in the browser's console
* related to performance metrics (see react-server.core.ClientController).
*/
export default class ElementsPage {

	getElements() {

		const colorThings = [];
		for (var i = 0; i < 10000; i++) {
			// Select a random element from the colors of the rainbow
			let selection = Math.floor(Math.random() * ColorSize);
			colorThings.push(ColorWheel[selection]);
		};

		return (colorThings);
	}
}
