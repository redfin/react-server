import { connect } from "react-redux";
import { selectMeteor, selectSort } from "../stores/actions";
import Table from "./Table";

const mapStateToProps = state => ({
	meteors: state.meteors.map(s => ({
		id: s.id,
		name: s.name,
		mass: s.mass,
		year: s.year.substring(0, 4),
		selected: s.selected,
	})),
});

const mapDispatchToProps = (dispatch) => ({
	onRowClick: id => dispatch(selectMeteor(id)),
	onHeaderClick: id => dispatch(selectSort(id)),
});

const MeteorTable = connect(
	mapStateToProps,
	mapDispatchToProps
)(Table);

export default MeteorTable;
