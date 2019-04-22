import PropTypes from 'prop-types';
import React from "react";
import { Link } from "react-server";

const headerColumns = [
	{ id: 0, name: "Name", link: "/" },
	{ id: 1, name: "Mass", "link": "/sort/mass" },
	{ id: 2, name: "Year", "link": "/sort/year" },
];
const Header = ({ onHeaderClick }) => (
	<thead>
		<tr>
			{headerColumns.map(h =>
				<th className="pointer" key={h.id} onClick={() => onHeaderClick(h.id)}>
					<Link path={h.link}>{h.name}</Link>
				</th>
			)}
		</tr>
	</thead>
);
Header.propTypes = {
	onHeaderClick: PropTypes.func.isRequired,
};

const Row = ({ id, name, mass, year, selected, onRowClick }) => {
	const selectedClass = selected ? "info pointer" : "pointer";
	return (
		<tr onClick={() => onRowClick(id)} className={selectedClass}>
			<td>{name}</td><td>{mass}</td><td>{year}</td>
		</tr>
	);
};
Row.propTypes = {
	id: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	mass: PropTypes.string.isRequired,
	year: PropTypes.string.isRequired,
	selected: PropTypes.bool,
	onRowClick: PropTypes.func.isRequired,
};

const Table = ({ header, meteors, onRowClick, onHeaderClick }) => (
	<table className="table table-striped table-hover">
		<Header header={header} onHeaderClick={onHeaderClick} />
		<tbody>
			{meteors.map(meteor =>
				<Row
					key={meteor.id}
					onRowClick={onRowClick}
					{...meteor}
				/>
			)}
		</tbody>
	</table>
);

Table.propTypes = {
	header: PropTypes.string.isRequired,
	meteors: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		mass: PropTypes.string.isRequired,
		year: PropTypes.string.isRequired,
		selected: PropTypes.bool,
	}).isRequired).isRequired,
	onHeaderClick: PropTypes.func.isRequired,
	onRowClick: PropTypes.func.isRequired,
};

export default Table;
