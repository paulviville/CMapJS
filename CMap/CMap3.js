import CMap2 from './CMap2.js';

function CMap3(){
	CMap2.call(this);

	this.phi3 = this.add_topology_relation("phi3");
	
	this.vertex2 = this.vertex;
	this.face2 = this.face;
	this.edge2 = this.edge;
	this.vertex = this.add_celltype();
	this.edge = this.add_celltype();
	this.face = this.add_celltype();
	this.connex = this.add_celltype();

	const vertex2 = this.vertex2;
	const edge2 = this.edge2;
	const face2 = this.face2;
	const vertex = this.vertex;
	const edge = this.edge;
	const face = this.face;
	const volume = this.volume;
	const connex = this.connex;

	this.sew_phi3 = function(d0, d1){
		this.phi3[d0] = d1;
		this.phi3[d1] = d0;
	};

	this.unsew_phi3 = function(d){
		let d1 = this.phi3[d];
		this.phi3[d] = d;
		this.phi3[d1] = d1;
	};

	this.close_hole2 = this.close_hole;
	this.close_hole = function(d0, boundary = false, set_embeddings = true) {
		if(this.phi3[d0] != d0)
			return;

		let visited = this.new_marker();
		let hole = this.new_marker();
		let faces = [d0];
		
		do {
			let fd0 = faces.shift();
			if(this.phi3[d0] != d0)
				continue;

			// codegree of face... to be written 
			let codegree = 0;
			this.foreach_dart_of(face2, fd0, d => {
				++codegree;
			});

			let fdh = this.add_face(codegree, false);
			let fd = fd0;
			do {
				this.sew_phi3(fd, fdh);
				
				let done = false;
				let d = this.phi3[this.phi2[fd]];
				do {
					if(this.phi3[d] == d){
						done = true;

					}
					else{
						if(this.phi2[d] == d){
							done = true;
							this.sew_phi2(d, fdh);
						}
						else{
							d = this.phi3[this.phi2[d]];
						}


					}
				} while (!done);

				fdh = this.phi_1[fdh];
				fd = this.phi1[fd];
			} while (fd != fd0);
		} while (faces.length);

		visited.delete();
		hole.delete();

		let wd = this.phi3[d0];
		if(boundary)
			this.mark_cell_as_boundary(volume, wd);

		if(set_embeddings){
			if(this.is_embedded(vertex2)){

			}
			if(this.is_embedded(edge2)){

			}
			if(this.is_embedded(face2)){

			}
			if(this.is_embedded(volume)){

			}
			if(this.is_embedded(vertex)){

			}
			if(this.is_embedded(edge)){

			}
			if(this.is_embedded(face)){
				
			}
			if(this.is_embedded(connex)){

			}
		}

		return wd;
	};


	this.close2 = this.close;
	this.close = function(boundary = true, set_embeddings = true){
		this.foreach_dart(d0 => {
			this.close_hole(d0, boundary, set_embeddings);
		});
	};

	/// Traverses and applies func to all darts of face 3
	this.foreach_dart_phi1_phi3 = function(d0, func){
		let stop;
		this.foreach_dart_phi1(d0, d1 => {
			stop = func(d1);
			return stop;
		});
		if(!stop)
			this.foreach_dart_phi1(this.phi3[d0], func);
	};

	/// Traverses and applies func to all darts of edge 3
	this.foreach_dart_phi2_phi3 = function(d0, func){
		let d = d0;
		do {
			if(func(d)) break;
			d = this.phi2[d];

			if(func(d)) break;
			d = this.phi3[d];
		} while (d != d0);
	};

	/// Traverses and applies func to all darts of vertex 3
	this.foreach_dart_phi21_phi31 = function(d0, func){
		let marker = this.new_marker();
		let volumes = [d0];

		let stop;
		while(volumes.length && !stop){
			let wd = volumes.shift();
			this.foreach_dart_phi21(wd, d => {
				if(!marker.marked(d)){
					marker.mark(d);
					stop = func(d);
				}						
				if(!marker.marked(this.phi1[this.phi3[d]]))
				volumes.push(this.phi1[this.phi3[d]]);
				return stop;
			});
		}
		marker.delete();
	};

	// Traverses and applies func to all darts of connex
	this.foreach_dart_phi1_phi2_phi3 = function(d0, func){
		let marker = this.new_marker();
		let volumes = [d0];

		let stop;
		while(volumes.length && !stop){
			let wd = volumes.shift();
			this.foreach_dart_phi1_phi2(wd, d => {
				if(!marker.marked(d)){
					marker.mark(d);
					stop = func(d);
				}							
				if(!marker.marked(this.phi3[d]))
					volumes.push(this.phi3[d]);
				return stop;
			});
		}

		marker.delete();
	};

	this.funcs_set_embeddings[vertex] = function(){
		if(!this.is_embedded(vertex))
			this.create_embedding(vertex);

		this.foreach(vertex, vd => {
			let vid = this.new_cell(vertex);
				this.foreach_dart_phi21_phi31(vd, d => {
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

			this.foreach_dart_phi21_phi31(d, d1 => { marker.mark(d1); });
			return func(d);
		});

		marker.delete();
	};

	this.funcs_foreach_dart_of[vertex] = function(wd, func){
		this.foreach_dart_phi21_phi31(wd, func);
	};

	this.funcs_set_embeddings[edge] = function(){
		if(!this.is_embedded(edge))
			this.create_embedding(edge);

		this.foreach(edge, ed => {
			let eid = this.new_cell(edge);
			this.foreach_dart_phi2_phi3(ed, d => {
				this.set_embedding(edge, d, eid);
			});
		});
	};

	this.funcs_foreach[edge] = function(func, cache){
		if(cache){
			cache.some(d => func(d));
			return;
		}

		let marker = this.new_marker();
		this.foreach_dart(d => {
			if(marker.marked(d))
				return;

			this.foreach_dart_phi2_phi3(d, d1 => { marker.mark(d1) });
			return func(d);
		});

		marker.delete();
	};

	this.funcs_foreach_dart_of[edge] = function(wd, func){
		this.foreach_dart_phi2_phi3(wd, func);
	};

	this.funcs_set_embeddings[face] = function(){
		if(!this.is_embedded(face))
			this.create_embedding(face);

		this.foreach(face, fd => {
			let fid = this.new_cell(face);
			this.foreach_dart_phi1_phi3(fd, d => {
				this.set_embedding(face, d, fid);
			});
		});
	};

	this.funcs_foreach[face] = function(func, cache){
		if(cache){
			cache.some(d => func(d));
			return;
		}

		let marker = this.new_marker();
		this.foreach_dart(d => {
			if(marker.marked(d))
				return;

			this.foreach_dart_phi1_phi3(d, d1 => { marker.mark(d1) });
			return func(d);
		});

		marker.delete();
	};

	this.funcs_foreach_dart_of[face] = function(wd, func){
		this.foreach_dart_phi1_phi3(wd, func);
	};

	this.funcs_set_embeddings[connex] = function(){
		if(!this.is_embedded(connex))
			this.create_embedding(connex);

		this.foreach(connex, cd => {
			let cid = this.new_cell(connex);
			this.foreach_dart_phi1_phi2_phi3(cd, d => {
				this.set_embedding(connex, d, cid);
			});
		});
	};

	this.funcs_foreach[connex] = function(func, cache){
		if(cache){
			cache.some(d => func(d));
			return;
		}

		let marker = this.new_marker();
		this.foreach_dart(d => {
			if(marker.marked(d))
				return;

			this.foreach_dart_phi1_phi2_phi3(d, d1 => { marker.mark(d1) });
			return func(d);
		});

		marker.delete();
	};

	this.funcs_foreach_dart_of[connex] = function(wd, func){
		this.foreach_dart_phi1_phi2_phi3(wd, func);
	};

	/// OPERATIONS
	this.cut_edge2 = this.cut_edge;
	this.cut_edge;
	this.cut_face2 = this.cut_face;
	this.cut_face;
	this.cut_volume;

	this.collapse_edge;
	this.merge_faces;
	this.merge_volumes;

}

export default CMap3;
