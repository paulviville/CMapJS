import CMapBase from './CMapBase.js';

function CMap0()
{
	CMapBase.call(this);

	// ORBITS
	this.vertex = this.addCelltype();
	const vertex = this.vertex;

	this.funcsForeach_dart_of[vertex] = function(vd, func) {func(vd)};
}

export default CMap0;