
import Color from 'color';

// from http://www.colourlovers.com/palette/132637/Odd_but_trendy
const oddButTrendyPrimaryButtonColor = Color('#7DB4B5');
const oddButTrendySecondaryButtonColor = Color('#E0EFF1');
export const oddButTrendy = {
	theme: {
		primaryButtonColor: oddButTrendyPrimaryButtonColor.hexString(),
		primaryButtonLightColor: oddButTrendyPrimaryButtonColor.lighten(0.2).hexString(),
		secondaryButtonColor: oddButTrendySecondaryButtonColor.hexString(),
		secondaryButtonLightColor: oddButTrendySecondaryButtonColor.lighten(0.2).hexString(),
		bannerTextColor: '#680148'
	},
	name: 'oddButTrendy'
}

// from http://www.colourlovers.com/palette/154405/Ladbrokes
const ladbrokesPrimaryButtonColor = Color('#609000');
const ladbrokesSecondaryButtonColor = Color('#C0C078');
export const ladbrokes = {
	theme: {
		primaryButtonColor: ladbrokesPrimaryButtonColor.hexString(),
		primaryButtonLightColor: ladbrokesPrimaryButtonColor.lighten(0.2).hexString(),
		secondaryButtonColor: ladbrokesSecondaryButtonColor.hexString(),
		secondaryButtonLightColor: ladbrokesSecondaryButtonColor.lighten(0.2).hexString(),
		bannerTextColor: '#F00000'
	},
	name: 'ladbrokes'
}
