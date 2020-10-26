import CMap0 from './CMap0.js';

function CMap1()
{
	CMap0.call(this);
	
	this.phi1 = this.add_topology_relation("phi1");
	this.phi_1 = this.add_topology_relation("phi_1");

	// TOPOLOGY
	this.sew_phi1 = function(d0, d1){
		let e0 = this.phi1[d0];
		let e1 = this.phi1[d1];
		this.phi1[d0] = e1;
		this.phi1[d1] = e0;
		this.phi_1[e1] = d0;
		this.phi_1[e0] = d1;
	};

	this.unsew_phi1 = function(d0){
		let d1 = this.phi1[d0];
		let d2 = this.phi1[d1];

		this.phi1[d0] = d2;
		this.phi1[d1] = d1;
		this.phi_1[d2] = d0;
		this.phi_1[d1] = d1;
	};

	/// Traverses and applies func to all darts of face 1 - 2
	this.foreach_dart_phi1 = function(d0, func){
		let d = d0;
		do
		{
			if(func(d)) return;
				d = this.phi1[d];
		} while (d != d0);
	};


	// ORBITS
	const vertex = this.vertex;

	this.edge = this.add_celltype();
	const edge = this.edge;
	this.funcs_set_embeddings[edge] = function(){
		this.foreach_dart(d => {
			this.set_embedding(edge, d, this.new_cell(edge));
		});
	};

	this.funcs_foreach[edge] = function(func, {cache = undefined, use_emb = false}){
		if(cache){
			cache.some(d => func(d));
			return;
		}
			
		this.foreach_dart(func);
	};

	this.funcs_foreach_dart_of[edge] = function(ed, func) {func(ed)};

	this.face = this.add_celltype();
	const face = this.face;
	this.funcs_set_embeddings[face] = function(){
		this.foreach(face, fd => {
			let fid = this.new_cell(face);
			this.foreach_dart_phi1(fd, d => {
				this.set_embedding(face, d, fid);
			});
		});
	};

	this.funcs_foreach[face] = function(func, {cache = undefined, use_emb = false}){
		if(cache){
			cache.some(d => func(d));
			return;
		}
		
		let marker = this.new_fast_marker(use_emb? face : undefined);
		if(use_emb)
			this.foreach_dart(d0 => {
				if(marker.marked(d0))
					return;

				marker.mark(d0);
				func(d0);
			});
		else
			this.foreach_dart(d0 => {
				if(marker.marked(d0))
					return;

				marker.mark_cell(face, d0)
				func(d0);
			});
	};


	this.funcs_foreach_dart_of[face] = function(fd, func){
		this.foreach_dart_phi1(fd, func);
	};

	// OPERATIONS
	this.add_face = function(nb_sides, set_embeddings = true){
		let d0 = this.new_dart();
		for(let i = 1; i < nb_sides; i++){
			let d1 = this.new_dart();
			this.sew_phi1(d0, d1);
		}

		if(set_embeddings){
			if(this.is_embedded(vertex))
				this.foreach_dart_phi1(d0, d1 => {
					this.set_embedding(vertex, d1, this.new_cell(vertex));
				});
			if(this.is_embedded(edge))
				this.foreach_dart_phi1(d0, d1 => {
					this.set_embedding(edge, d1, this.new_cell(edge));
				});
			if(this.is_embedded(face)){
				let fid = this.new_cell(face);
				this.foreach_dart_phi1(d0, d1 => {
					this.set_embedding(face, d1, fid);
				});
			}
		}

		return d0;
	};

	this.cut_edge = function(ed, set_embeddings = true){
		let d0 = ed;
		let d1 = this.new_dart();

		this.sew_phi1(d0, d1);

		if(this.is_boundary(d0))
			this.mark_as_boundary(d1);

		if(set_embeddings){
			if(this.is_embedded(vertex))
				this.set_embedding(vertex, d1, this.new_cell(vertex));
			if(this.is_embedded(edge))
				this.set_embedding(edge, d1, this.new_cell(edge));
			if(this.is_embedded(face))
				this.set_embedding(face, d1, this.new_cell(face));
		}

		return d1;
	};

	this.collapse_edge = function(ed, set_embeddings = true){
		let d0 = this.phi_1[ed];
		this.unsew_phi1(d0);
		let d1 = this.phi1[d0];

		this.delete_dart(ed);
		return d1;
	};

	this.split_vertex = function(vd, set_embeddings = true){
		let d0 = this.phi_1(vd);
		let d1 = this.new_dart();

		this.sew_phi1(d0, d1);

		if(this.is_boundary(d0))
			this.mark_as_boundary(d1);

		if(set_embeddings){
			if(this.is_embedded(vertex))
				this.set_embedding(vertex, d1, this.new_cell(vertex));
			if(this.is_embedded(edge))
				this.set_embedding(edge, d1, this.new_cell(edge));
			if(this.is_embedded(face))
				this.set_embedding(face, d1, this.cell(face, d0));
		}

		return d1;
	};
}

export default CMap1;
