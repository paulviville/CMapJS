import CMap1 from './CMap1.js';

function CMap2(){
	CMap1.call(this);

	// TOPOLOGY
	this.phi2 = this.add_topology_relation("phi2");
	
	this.volume = this.add_celltype();

	this.sew_phi2 = function(d0, d1){
		this.phi2[d0] = d1;
		this.phi2[d1] = d0;
	};

	this.unsew_phi2 = function(d){
		let d1 = this.phi2[d];
		this.phi2[d] = d;
		this.phi2[d1] = d1;
	};

	this.close = function(boundary = false, set_embeddings = true){
		this.foreach_dart(d0 => {
			if(this.phi2[d0] != d0)
				return;

			let d1 = d0;
			let path = [];

			do{
				d1 = this.phi1[d1];
				if(this.phi2[d1] != d1){
					while(this.phi2[d1] != d1)
						d1 = this.phi1[this.phi2[d1]];
				}
				path.push(d1);
			} while(d1 != d0);
			
			let fd = this.add_face(path.length, false);
			if(boundary)
				this.mark_cell_as_boundary(this.face, fd);
			for(let i = 0; i < path.length; ++i){
				this.sew_phi2(fd, path[i]);
				fd = this.phi_1[fd];
			}

			if(set_embeddings){
				let fid = this.is_embedded(this.face)? this.new_cell(this.face) : undefined;
				this.foreach_dart_of(this.face, fd, d => {
					if(this.is_embedded(this.vertex))
						this.set_embedding(this.vertex, d, this.cell(this.vertex, this.phi1[this.phi2[d]]));
					if(this.is_embedded(this.edge))
						this.set_embedding(this.edge, d, this.cell(this.edge, this.phi2[d]));
					if(this.is_embedded(this.face))
						this.set_embedding(this.face, d, fid);
				});
			}
		});
	}

	// ORBITS
	this.foreach_dart_phi2 = function(d, func){
		if(!func(d))
			func(this.phi2[d]);	
	}

	this.foreach_dart_phi12 = function(d0, func){
		let d = d0;
		do{
			if(func(d)) break;
			d = this.phi1[this.phi2[d]];
		} while (d != d0);
	};

	// TODO	: TEST 	
	this.foreach_dart_phi1_phi2 = function(d0, func){
		let marker = this.new_marker();
		let faces = [d0];

		while(faces.length){
			let fd = faces.shift();
			this.foreach_dart_phi1(fd, d => {
				if(!marker.marked(d)){
					marker.mark(d);
					func(d);
				}							
				if(!marker.marked(this.phi2[d]))
					faces.push(this.phi2[d]);
			});
		}

		marker.delete();
	};

	this.funcs_set_embeddings[this.vertex] = function(){
		if(!this.is_embedded(this.vertex))
			this.create_embedding(this.vertex);

		this.foreach(this.vertex, vd => {
			let vid = this.new_cell(this.vertex);
			this.foreach_dart_phi12(vd, d => {
				this.set_embedding(this.vertex, d, vid);
			});
		});
	}

	this.funcs_foreach[this.vertex] = function(func, cache){
		if(cache){
			cache.some(d => func(d));
			return;
		}

		let marker = this.new_marker();
		this.foreach_dart(d => {
			if(marker.marked(d))
				return;

			this.foreach_dart_phi12(d, d1 => { marker.mark(d1) });
			return func(d);
		});

		marker.delete();
	}

	this.funcs_foreach_dart_of[this.vertex] = function(vd, func){
		this.foreach_dart_phi12(vd, func);
	};


	this.funcs_set_embeddings[this.edge] = function(){
		if(!this.is_embedded(this.edge))
			this.create_embedding(this.edge);

		this.foreach(this.edge, ed => {
			let eid = this.new_cell(this.edge);
			this.foreach_dart_phi2(ed, d => {
				this.set_embedding(this.edge, d, eid);
			});
		});
	}

	this.funcs_foreach[this.edge] = function(func, cache){
		if(cache){
			cache.forEach(ed => func(ed));
			return;
		}

		let marker = this.new_marker();
		this.foreach_dart(d => {
			if(marker.marked(d))
				return;

			marker.mark(d);
			marker.mark(this.phi2[d]);

			func(d);
		});
		marker.delete();
	}

	this.funcs_foreach_dart_of[this.edge] = function(ed, func){
		this.foreach_dart_phi2(ed, func);
	}


	this.funcs_set_embeddings[this.volume] = function(){
		if(!this.is_embedded(this.volume))
			this.create_embedding(this.volume);

		this.foreach(this.volume, wd => {
			let wid = this.new_cell(this.volume);
			console.log("wid: ", wid)
			this.foreach_dart_phi1_phi2(wd, d => {
				this.set_embedding(this.volume, d, wid);
			});
		});
	}

	this.funcs_foreach[this.volume] = function(func, cache){
		if(cache){
			cache.forEach(wd => func(wd));
			return;
		}

		let marker = this.new_marker();
		this.foreach_dart(d0 => {
			if(marker.marked(d0))
				return;

			this.foreach_dart_phi1_phi2(d0, d1 => marker.mark(d1));
			func(d0);
		});
		marker.delete();
	}

	this.funcs_foreach_dart_of[this.volume] = function(wd, func){
		this.foreach_dart_phi1_phi2(wd, func);
	}

	// OPERATIONS
	this.cut_edge1 = this.cut_edge;
	this.cut_edge = function(ed, set_embeddings = true){
		let d0 = ed;
		let e0 = this.phi2[d0];
		this.unsew_phi2(d0);

		let d1 = this.cut_edge1(d0, false);
		let e1 = this.cut_edge1(e0, false);

		this.sew_phi2(d0, e1);
		this.sew_phi2(e0, d1);	

		if(set_embeddings){
			if(this.is_embedded(this.vertex)){
				let vid = this.new_cell(this.vertex);
				this.set_embedding(this.vertex, d1, vid);
				this.set_embedding(this.vertex, e1, vid);
			}
			if(this.is_embedded(this.edge)){
				let eid = this.new_cell(this.edge);
				this.set_embedding(this.edge, d1, this.cell(this.edge, e0));
				this.set_embedding(this.edge, e1, eid);
				this.set_embedding(this.edge, d0, eid);
			}
			if(this.is_embedded(this.face)){
				this.set_embedding(this.face, d1, this.cell(this.face, d0));
				this.set_embedding(this.face, e1, this.cell(this.face, e0));
			}
		}

		return d1;
	}

	this.collapse_edge1 = this.collapse_edge;
	this.collapse_edge = function(ed, set_embeddings = true){
		let d0 = ed;
		let e0 = this.phi2[ed];
		let eid = this.cell(this.edge, ed);
		
		this.unsew_phi2(d0);
		let d1 = this.collapse_edge1(d0, false);
		let e1 = this.collapse_edge1(e0, false);
		
		if(set_embeddings){
			if(this.is_embedded(this.vertex)){
				let vid0 = this.cell(this.vertex, d1);
				let vid1 = this.cell(this.vertex, e1);
				this.foreach_dart_phi12(e1,d => {
					this.set_embedding(this.vertex, d, vid0);
				});
				this.delete_cell(this.vertex, vid1); // should remove this and test
			}
		}
		
		return d1;
	}

	this.split_vertex1 = this.split_vertex;
	this.split_vertex = function(vd0, vd1, set_embeddings = true){
		let d0 = this.split_vertex1(vd0, false);
		let d1 = this.split_vertex1(vd1, false);

		this.sew_phi2(d0, d1);

		if(set_embeddings){
			if(this.is_embedded(this.vertex)){
				let vid = this.new_cell(this.vertex);
				this.foreach_dart_of(this.vertex, d0, d => {
					this.set_embedding(this.vertex, d, vid);
				});
				this.set_embedding(this.vertex, d1, this.cell(this.vertex, vd0));
			}
			if(this.is_embedded(this.edge)){
				let eid = this.new_cell(this.edge);
				this.set_embedding(this.edge, d0, eid);
				this.set_embedding(this.edge, d1, eid);
			}
			if(this.is_embedded(this.face)){
				this.set_embedding(this.face, d0, this.cell(this.face, vd0));
				this.set_embedding(this.face, d1, this.cell(this.face, vd1));
			}
		}

		return d0;
	}

	this.cut_face = function(fd0, fd1, set_embeddings = true){
		let d0 = this.phi_1[fd0];
		let d1 = this.phi_1[fd1];

		let e0 = this.new_dart();
		let e1 = this.new_dart();
		this.sew_phi2(e0, e1);
		this.sew_phi1(d0, e0);
		this.sew_phi1(d1, e1);
		this.sew_phi1(e0, e1);

		if(this.is_boundary_cell(this.face, fd0))
			this.mark_cell_as_boundary(this.edge, e0);

		if(set_embeddings){
			if(this.is_embedded(this.vertex)){
				this.set_embedding(this.vertex, e0, this.cell(this.vertex, this.phi1[this.phi2[e0]]));
				this.set_embedding(this.vertex, e1, this.cell(this.vertex, this.phi1[this.phi2[e1]]));
			}
			if(this.is_embedded(this.edge)){
				let eid = this.new_cell(this.edge);
				this.set_embedding(this.edge, e0, eid);
				this.set_embedding(this.edge, e1, eid);
			}
			if(this.is_embedded(this.face)){
				this.set_embedding(this.face, e0, this.cell(this.face, this.phi1[e0]));
				let fid = this.new_cell(this.face);
				this.foreach_dart_phi1(e1, d => {
					this.set_embedding(this.face, d, fid);
				});
			}
		}

		return e0;
	}

	this.merge_faces = function(ed, set_embeddings = true){
		let fd = this.phi1[ed];
		let d0 = ed, 
			d1 = this.phi2[ed];

		this.sew_phi1(this.phi_1[d0], d1);
		this.sew_phi1(this.phi_1[d1], d0);

		if(set_embeddings){
			if(this.is_embedded(this.face)){
				let fid0 = this.cell(this.face, d0);
				this.foreach_dart_of(this.face, fd, d => {
					this.set_embedding(this.face, d, fid0);
				});
			}
		}

		this.delete_dart(d0);
		this.delete_dart(d1);
	}


	this.flip_edge = function(ed, set_embeddings = true){
		let d0 = ed,
			d1 = this.phi1[d0],
			e0 = this.phi2[ed],
			e1 = this.phi1[e0];

		this.sew_phi1(this.phi_1[d0], e0);
		this.sew_phi1(this.phi_1[e0], d0);

		this.sew_phi1(e0, e1);
		this.sew_phi1(d0, d1);

		if(set_embeddings){
			if(this.is_embedded(this.vertex)){
				this.set_embedding(this.vertex, d0, this.cell(this.vertex, this.phi1[e0]));
				this.set_embedding(this.vertex, e0, this.cell(this.vertex, this.phi1[d0]));
			}
			if(this.is_embedded(this.face)){
				this.set_embedding(this.face, this.phi_1[d0], this.cell(this.face, d0));
				this.set_embedding(this.face, this.phi_1[e0], this.cell(this.face, e0));
			}
		}

		return ed;
	}
}

export default CMap2;
