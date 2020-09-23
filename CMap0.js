import CMap_Base from './CMap_Base.js';

function CMap0()
{
	CMap_Base.call(this);

	// ORBITS
	this.vertex = this.add_celltype();
	this.funcs_set_embeddings[this.vertex] = function()
		{
			if(!this.is_embedded(this.vertex))
				this.create_embedding(this.vertex);

			this.foreach_dart(d => {
				this.set_embedding(this.vertex, d, this.new_cell(this.vertex));
			});
		}

	this.funcs_foreach[this.vertex] = function(func, cache)
		{
			if(cache)
				{
					cache.some(d => func(d));
					return;
				}

			this.foreach_dart(func);
		}

	this.funcs_foreach_dart_of[this.vertex] = function(vd, func) {func(vd)};
}

export default CMap0;