import CMap_Base from './CMap_Base.js';

function CMap0()
{
	CMap_Base.call(this);

	// ORBITS
	this.vertex = this.add_celltype();
	const vertex = this.vertex;

	this.funcs_foreach_dart_of[vertex] = function(vd, func) {func(vd)};
}

export default CMap0;