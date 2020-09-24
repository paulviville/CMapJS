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

	this.foreach_dart_phi1 = function(d0, func){
		let d = d0;
		do
		{
			if(func(d)) return;
				d = this.phi1[d];
		} while (d != d0);
	};


	// ORBITS
	this.edge = this.add_celltype();
	this.funcs_set_embeddings[this.edge] = function(){
		if(!this.is_embedded(this.edge))
			this.create_embedding(this.edge);

		this.foreach_dart(d => {
			this.set_embedding(this.edge, d, this.new_cell(this.edge));
		});
	}

	this.funcs_foreach[this.edge] = function(func, cache){
		if(cache){
			cache.some(d => func(d));
			return;
		}
			
		this.foreach_dart(func);
	}

	this.funcs_foreach_dart_of[this.edge] = function(ed, func) {func(ed)};


	this.face = this.add_celltype();
	this.funcs_set_embeddings[this.face] = function(){
		if(!this.is_embedded(this.face))
			this.create_embedding(this.face);

		this.foreach(this.face, fd => {
			let fid = this.new_cell(this.face);
			this.foreach_dart_phi1(fd, d => {
				this.set_embedding(this.face, d, fid);
			});
		});
	}

	this.funcs_foreach[this.face] = function(func, cache){
		if(cache){
			cache.some(d => func(d));
			return;
		}
		
		let marker = this.new_marker();
		this.foreach_dart(d0 => {
			if(marker.marked(d0))
				return;

			this.foreach_dart_phi1(d0, d1 => {marker.mark(d1)});

			func(d0);
		});

		marker.delete();
	}

	this.funcs_foreach_dart_of[this.face] = function(fd, func){
		this.foreach_dart_phi1(fd, d => func(d));
	};

	

	// OPERATIONS
	this.add_face = function(nb_sides, set_embeddings = true){
		let d0 = this.new_dart();
		for(let i = 1; i < nb_sides; i++){
			let d1 = this.new_dart();
			this.sew_phi1(d0, d1);
		}

		if(set_embeddings){
			if(this.is_embedded(this.vertex))
				this.foreach_dart_phi1(d0, d1 => {
					this.set_embedding(this.vertex, d1, this.new_cell(this.vertex));
				});
			if(this.is_embedded(this.edge))
				this.foreach_dart_phi1(d0, d1 => {
					this.set_embedding(this.edge, d1, this.new_cell(this.edge));
				});
			if(this.is_embedded(this.face)){
				let fid = this.new_cell(this.face);
				this.foreach_dart_phi1(d0, d1 => {
					this.set_embedding(this.face, d1, fid);
				});
			}
		}

		return d0;
	}

	this.cut_edge = function(ed, set_embeddings = true){
		let d0 = ed;
		let d1 = this.new_dart();

		this.sew_phi1(d0, d1);

		if(this.is_boundary(d0))
			this.mark_as_boundary(d1);

		if(set_embeddings){
			if(this.is_embedded(this.vertex))
				this.set_embedding(this.vertex, d1, this.new_cell(this.vertex));
			if(this.is_embedded(this.edge))
				this.set_embedding(this.edge, d1, this.new_cell(this.edge));
			if(this.is_embedded(this.face))
				this.set_embedding(this.face, d1, this.new_cell(this.face));
		}

		return d1;
	}

	this.collapse_edge = function(ed, set_embeddings = true){
		let d0 = this.phi_1[ed];
		this.unsew_phi1(d0);
		let d1 = this.phi1[d0];

		this.delete_dart(ed);
		return d1;
	}

	this.split_vertex = function(vd, set_embeddings = true){
		let d0 = this.phi_1(vd);
		let d1 = this.new_dart();

		this.sew_phi1(d0, d1);

		if(this.is_boundary(d0))
			this.mark_as_boundary(d1);

		if(set_embeddings){
			if(this.is_embedded(this.vertex))
				this.set_embedding(this.vertexd1, this.new_cell(this.vertex));
			if(this.is_embedded(this.edge))
				this.set_embedding(this.edged1, this.new_cell(this.edge));
			if(this.is_embedded(this.face))
				this.set_embedding(this.face, d1, this.cell(this.face, d0));
		}

		return d1;
	}
}

export default CMap1;
