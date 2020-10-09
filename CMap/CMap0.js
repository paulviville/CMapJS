import CMap_Base from './CMap_Base.js';

function CMap0()
{
	CMap_Base.call(this);

	// ORBITS
	this.vertex = this.add_celltype();
	const vertex = this.vertex;

	this.funcs_set_embeddings[vertex] = function(){
		this.foreach_dart(d => {
			this.set_embedding(vertex, d, this.new_cell(vertex));
		});
	};

	this.funcs_foreach[vertex] = function(func, cache){
		if(cache){
			cache.some(d => func(d));
			return;
		}

		this.foreach_dart(func);
	};

	this.funcs_foreach_dart_of[vertex] = function(vd, func) {func(vd)};
}

export default CMap0;