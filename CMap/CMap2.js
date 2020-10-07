import CMap1 from './CMap1.js';

function CMap2(){
	CMap1.call(this);

	// TOPOLOGY
	this.phi2 = this.add_topology_relation("phi2");
	
	const vertex = this.vertex;
	const edge = this.edge;
	const face = this.face;
	this.volume = this.add_celltype();
	const volume = this.volume;
	
	this.sew_phi2 = function(d0, d1){
		this.phi2[d0] = d1;
		this.phi2[d1] = d0;
	};

	this.unsew_phi2 = function(d){
		let d1 = this.phi2[d];
		this.phi2[d] = d;
		this.phi2[d1] = d1;
	};

	this.close_hole = function(d0, boundary = false, set_embeddings = true) {
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
			this.mark_cell_as_boundary(face, fd);
		for(let i = 0; i < path.length; ++i){
			this.sew_phi2(fd, path[i]);
			fd = this.phi_1[fd];
		}

		if(set_embeddings){
			let fid = this.is_embedded(face)? this.new_cell(face) : undefined;
			this.foreach_dart_of(face, fd, d => {
				if(this.is_embedded(vertex))
					this.set_embedding(vertex, d, this.cell(vertex, this.phi1[this.phi2[d]]));
				if(this.is_embedded(edge))
					this.set_embedding(edge, d, this.cell(edge, this.phi2[d]));
				if(this.is_embedded(face))
					this.set_embedding(face, d, fid);
			});
		}

		return fd;
	}
	const close_hole = this.close_hole.bind(this);

	this.close = function(boundary = false, set_embeddings = true){
		this.foreach_dart(d0 => {
			close_hole(d0, boundary, set_embeddings);
		});
	};

	// ORBITS
	/// Traverses and applies func to all darts of edge 2
	this.foreach_dart_phi2 = function(d, func){
		if(!func(d))
			func(this.phi2[d]);	
	};

	/// Traverses and applies func to all darts of vertex 2
	this.foreach_dart_phi21 = function(d0, func){
		let d = d0;
		do {
			if(func(d)) break;
			d = this.phi1[this.phi2[d]];
		} while (d != d0);
	};

	/// Traverses and applies func to all darts of volume
	this.foreach_dart_phi1_phi2 = function(d0, func){
		let marker = this.new_marker();
		let faces = [d0];

		do {
			let fd = faces.shift();
			if(!marker.marked(fd)){
				let d = fd;
				do {
					if(func(d))
						return;
					marker.mark(d);
					let adj = this.phi2[d];
					if(!marker.marked(adj))
						faces.push(adj);
					d = this.phi1[d];
				} while (d != fd);
			}
		} while(faces.length);

		marker.delete();
	};

	this.funcs_set_embeddings[vertex] = function(){
		if(!this.is_embedded(vertex))
			this.create_embedding(vertex);

		this.foreach(vertex, vd => {
			let vid = this.new_cell(vertex);
			this.foreach_dart_phi21(vd, d => {
				this.set_embedding(vertex, d, vid);
			});
		});
	};

	this.funcs_foreach[vertex] = function(func, cache){
		if(cache){
			cache.some(d => func(d));
			return;
		}

		let marker = this.new_marker();
		this.foreach_dart(d => {
			if(marker.marked(d))
				return;

			this.foreach_dart_phi21(d, d1 => { marker.mark(d1) });
			return func(d);
		});

		marker.delete();
	};

	this.funcs_foreach_dart_of[vertex] = function(vd, func){
		this.foreach_dart_phi21(vd, func);
	};


	this.funcs_set_embeddings[edge] = function(){
		if(!this.is_embedded(edge))
			this.create_embedding(edge);

		this.foreach(edge, ed => {
			let eid = this.new_cell(edge);
			this.foreach_dart_phi2(ed, d => {
				this.set_embedding(edge, d, eid);
			});
		});
	};

	this.funcs_foreach[edge] = function(func, cache){
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
	};

	this.funcs_foreach_dart_of[edge] = function(ed, func){
		this.foreach_dart_phi2(ed, func);
	};


	this.funcs_set_embeddings[volume] = function(){
		if(!this.is_embedded(volume))
			this.create_embedding(volume);

		this.foreach(volume, wd => {
			let wid = this.new_cell(volume);
			console.log("wid: ", wid)
			this.foreach_dart_phi1_phi2(wd, d => {
				this.set_embedding(volume, d, wid);
			});
		});
	};

	this.funcs_foreach[volume] = function(func, cache){
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
	};

	this.funcs_foreach_dart_of[volume] = function(wd, func){
		this.foreach_dart_phi1_phi2(wd, func);
	};

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
			if(this.is_embedded(vertex)){
				let vid = this.new_cell(vertex);
				this.set_embedding(vertex, d1, vid);
				this.set_embedding(vertex, e1, vid);
			}
			if(this.is_embedded(edge)){
				let eid = this.new_cell(edge);
				this.set_embedding(edge, d1, this.cell(edge, e0));
				this.set_embedding(edge, e1, eid);
				this.set_embedding(edge, d0, eid);
			}
			if(this.is_embedded(face)){
				this.set_embedding(face, d1, this.cell(face, d0));
				this.set_embedding(face, e1, this.cell(face, e0));
			}
		}

		return d1;
	};

	this.collapse_edge1 = this.collapse_edge;
	this.collapse_edge = function(ed, set_embeddings = true){
		let d0 = ed;
		let e0 = this.phi2[ed];
		let eid = this.cell(edge, ed);
		
		this.unsew_phi2(d0);
		let d1 = this.collapse_edge1(d0, false);
		let e1 = this.collapse_edge1(e0, false);
		
		if(set_embeddings){
			if(this.is_embedded(vertex)){
				let vid0 = this.cell(vertex, d1);
				let vid1 = this.cell(vertex, e1);
				this.foreach_dart_phi21(e1,d => {
					this.set_embedding(vertex, d, vid0);
				});
				this.delete_cell(vertex, vid1); // should remove this and test
			}
		}
		
		return d1;
	};

	this.split_vertex1 = this.split_vertex;
	this.split_vertex = function(vd0, vd1, set_embeddings = true){
		let d0 = this.split_vertex1(vd0, false);
		let d1 = this.split_vertex1(vd1, false);

		this.sew_phi2(d0, d1);

		if(set_embeddings){
			if(this.is_embedded(vertex)){
				let vid = this.new_cell(vertex);
				this.foreach_dart_of(vertex, d0, d => {
					this.set_embedding(vertex, d, vid);
				});
				this.set_embedding(vertex, d1, this.cell(vertex, vd0));
			}
			if(this.is_embedded(edge)){
				let eid = this.new_cell(edge);
				this.set_embedding(edge, d0, eid);
				this.set_embedding(edge, d1, eid);
			}
			if(this.is_embedded(face)){
				this.set_embedding(face, d0, this.cell(face, vd0));
				this.set_embedding(face, d1, this.cell(face, vd1));
			}
		}

		return d0;
	};

	this.cut_face = function(fd0, fd1, set_embeddings = true){
		let d0 = this.phi_1[fd0];
		let d1 = this.phi_1[fd1];

		let e0 = this.new_dart();
		let e1 = this.new_dart();
		this.sew_phi2(e0, e1);
		this.sew_phi1(d0, e0);
		this.sew_phi1(d1, e1);
		this.sew_phi1(e0, e1);

		if(this.is_boundary_cell(face, fd0))
			this.mark_cell_as_boundary(edge, e0);

		if(set_embeddings){
			if(this.is_embedded(vertex)){
				this.set_embedding(vertex, e0, this.cell(vertex, this.phi1[this.phi2[e0]]));
				this.set_embedding(vertex, e1, this.cell(vertex, this.phi1[this.phi2[e1]]));
			}
			if(this.is_embedded(edge)){
				let eid = this.new_cell(edge);
				this.set_embedding(edge, e0, eid);
				this.set_embedding(edge, e1, eid);
			}
			if(this.is_embedded(face)){
				this.set_embedding(face, e0, this.cell(face, this.phi1[e0]));
				let fid = this.new_cell(face);
				this.foreach_dart_phi1(e1, d => {
					this.set_embedding(face, d, fid);
				});
			}
		}

		return e0;
	};

	this.merge_faces = function(ed, set_embeddings = true){
		let fd = this.phi1[ed];
		let d0 = ed, 
			d1 = this.phi2[ed];

		this.sew_phi1(this.phi_1[d0], d1);
		this.sew_phi1(this.phi_1[d1], d0);

		if(set_embeddings){
			if(this.is_embedded(face)){
				let fid0 = this.cell(face, d0);
				this.foreach_dart_of(face, fd, d => {
					this.set_embedding(face, d, fid0);
				});
			}
		}

		this.delete_dart(d0);
		this.delete_dart(d1);
	};


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
			if(this.is_embedded(vertex)){
				this.set_embedding(vertex, d0, this.cell(vertex, this.phi1[e0]));
				this.set_embedding(vertex, e0, this.cell(vertex, this.phi1[d0]));
			}
			if(this.is_embedded(face)){
				this.set_embedding(face, this.phi_1[d0], this.cell(face, d0));
				this.set_embedding(face, this.phi_1[e0], this.cell(face, e0));
			}
		}

		return ed;
	};

	this.add_face1 = this.add_face;
	// this.add_face = function(nb_sides, set_embeddings = true){

	// }

	this.add_prism = function(size = 3, set_embeddings = true) {
		let d0 = this.add_face(4, false);
		let d1 = d0;
		for(let i = 1; i < size; ++i){
			let fd = this.add_face(4, false);
			this.sew_phi2(this.phi1[d1], this.phi_1[fd]);
			d1 = fd;
		}
		this.sew_phi2(this.phi_1[d0], this.phi1[d1]);
		let d_base = close_hole(d0, false, false);
		close_hole(this.phi1[this.phi1[d0]]);

		if(set_embeddings){
			this.foreach_dart_of(volume, d_base, d => {
				if(this.is_embedded(vertex)){
					if(this.cell(vertex, d) == undefined){
						let vid = this.new_cell(vertex);
						this.foreach_dart_of(vertex, d, d2 => {
							this.set_embedding(vertex, d2, vid);
						});
					}
				}
				if(this.is_embedded(edge)){
					if(this.cell(edge, d) == undefined){
						let eid = this.new_cell(edge);
						this.foreach_dart_of(edge, d, d2 => {
							this.set_embedding(edge, d2, eid);
						});
					}
				}
				if(this.is_embedded(face)){
					if(this.cell(face, d) == undefined){
						let fid = this.new_cell(face);
						this.foreach_dart_of(face, d, d2 => {
							this.set_embedding(face, d2, fid);
						});
					}
				}
				if(this.is_embedded(volume)){
					if(this.cell(volume, d) == undefined){
						let wid = this.new_cell(volume);
						this.foreach_dart_of(volume, d, d2 => {
							this.set_embedding(volume, d2, wid);
						});
					}
				}
			});
		}

		return d_base;
	};

	this.add_pyramid = function(size = 3, set_embeddings = true) {
		let d0 = this.add_face(3, false);
		let d1 = d0;
		for(let i = 1; i < size; ++i){
			let fd = this.add_face(3, false);
			this.sew_phi2(this.phi1[d1], this.phi_1[fd]);
			d1 = fd;
		}
		this.sew_phi2(this.phi_1[d0], this.phi1[d]);
		let d_base = this.close_hole(d0, false, false);

		if(set_embeddings){
			this.foreach_dart_of(volume, d_base, d => {
				if(this.is_embedded(vertex)){
					if(this.cell(vertex, d) == undefined){
						let vid = this.new_cell(vertex);
						this.foreach_dart_of(vertex, d, d2 => {
							this.set_embedding(vertex, d2, vid);
						});
					}
				}
				if(this.is_embedded(edge)){
					if(this.cell(edge, d) == undefined){
						let eid = this.new_cell(edge);
						this.foreach_dart_of(edge, d, d2 => {
							this.set_embedding(edge, d2, eid);
						});
					}
				}
				if(this.is_embedded(face)){
					if(this.cell(face, d) == undefined){
						let fid = this.new_cell(face);
						this.foreach_dart_of(face, d, d2 => {
							this.set_embedding(face, d2, fid);
						});
					}
				}
				if(this.is_embedded(volume)){
					if(this.cell(volume, d) == undefined){
						let wid = this.new_cell(volume);
						this.foreach_dart_of(volume, d, d2 => {
							this.set_embedding(volume, d2, wid);
						});
					}
				}
			});
		}

		return d_base;
	};
}

export default CMap2;
