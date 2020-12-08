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
		// if(this.phi3[d0] != d0)
		// 	return;

		let visited = this.new_marker();
		let hole = this.new_marker();
		let faces = [d0];
		visited.mark_cell(face2, d0);

		do {
			let fd0 = faces.shift();

			// codegree of face... to be written 
			let codegree = 0;
			this.foreach_dart_of(face2, fd0, d => {
				++codegree;
				visited.mark(d);
			});

			let fd_h = this.add_face(codegree, false);
			hole.mark_cell(face2, fd_h)

			let fd = fd0;
			do {
				let done = false;
				let d = this.phi3[this.phi2[fd]];
				do {
					if(this.phi3[d] == d){
						done = true;
						if(!visited.marked(d)){
							faces.push(d);
							visited.mark_cell(this.face2, d);
						}
					}
					else{
						if(hole.marked(d)){
							done = true;
							this.sew_phi2(d, fd_h);
						}
						else{
							d = this.phi3[this.phi2[d]];
						}
					}
				} while (!done);

				this.sew_phi3(fd_h, fd);
				fd_h = this.phi_1[fd_h];
				fd = this.phi1[fd];
			} while (fd != fd0);
		} while (faces.length);

		visited.remove();
		hole.remove();

		let wd = this.phi3[d0];

		if(boundary)
			this.mark_cell_as_boundary(volume, wd);

		if(set_embeddings){
			let wid, ccid;
			if(this.is_embedded(volume))
				wid = this.new_cell(volume);
			if(this.is_embedded(connex))
				ccid = this.cell(connex, d0);

			this.foreach_dart_of(volume, wd, d00 => {
				if(this.is_embedded(vertex2)){
					if(!Number.isInteger(this.cell(vertex2, d00))){
						let v2id = this.new_cell(vertex2);
						this.foreach_dart_of(vertex2, d00, d1 =>{ this.set_embedding(vertex2, d1, v2id)});
					}
				}
				if(this.is_embedded(edge2)){
					if(!Number.isInteger(this.cell(edge2, d00))){
						let e2id = this.new_cell(edge2);
						this.foreach_dart_of(edge2, d00, d1 =>{ this.set_embedding(edge2, d1, e2id)});
					}
				}
				if(this.is_embedded(face2)){
					if(!Number.isInteger(this.cell(face2, d00))){
						let f2id = this.new_cell(face2);
						this.foreach_dart_of(face2, d00, d1 =>{ this.set_embedding(face2, d1, f2id)});
					}
				}
				if(wid != undefined){
					this.set_embedding(volume, d00, wid);
				}
				if(this.is_embedded(vertex)){
					if(!Number.isInteger(this.cell(vertex, d00))){
						let vid = this.cell(vertex, this.phi1[this.phi3[d00]]);
						this.foreach_dart_of(vertex2, d00, d1 =>{ this.set_embedding(vertex, d1, vid)});
					}
				}
				if(this.is_embedded(edge)){
					if(!Number.isInteger(this.cell(edge, d00))){
						let eid = this.cell(edge, this.phi3[d00]);
						this.foreach_dart_of(edge, d00, d1 =>{ this.set_embedding(edge, d1, eid)});
					}
				}
				if(this.is_embedded(face)){
					if(!Number.isInteger(this.cell(face, d00))){
						let eid = this.cell(face, this.phi3[d00]);
						this.foreach_dart_of(face, d00, d1 =>{ this.set_embedding(face, d1, eid)});
					}
				}
				if(ccid != undefined){
					this.set_embedding(connex, d00, ccid);
				}
			});
		}

		return wd;
	};


	this.close2 = this.close;
	this.close = function(boundary = true, set_embeddings = true){
		this.foreach_dart(d0 => {
			if(this.phi3[d0] == d0)
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
		let marker = this.new_fast_marker();
		let volumes = [d0];
		marker.mark(d0);
		do {
			let d = volumes.shift();
			
			if(func(d))	
				break;
			let d_1 = this.phi_1[d];
			let d2 = this.phi2[d_1];
			if(!marker.marked(d2)){
				marker.mark(d2);
				volumes.push(d2)
			}
			d2 = this.phi3[d_1];
			if(!marker.marked(d2)){
				marker.mark(d2);
				volumes.push(d2)
			}

		}while(volumes.length);
		// marker.remove();
	};

	// Traverses and applies func to all darts of connex
	this.foreach_dart_phi1_phi2_phi3 = function(d0, func){
		let marker = this.new_fast_marker();
		let volumes = [d0];

		do {
			let wd = volumes.shift();
			if(!marker.marked(wd)){
				let d = wd;
				do {
					if(func(d))
						return;
					marker.mark(d);
					let adj2 = this.phi2[d];
					if(!marker.marked(adj2))
						volumes.push(adj2);
					d = this.phi1[d];
				} while (d != wd);
				let adj3 = this.phi3[d];
				if(!marker.marked(adj3))
					volumes.push(adj3);
			}
		} while(volumes.length);
	};

	this.funcs_foreach_dart_of[vertex] = this.foreach_dart_phi21_phi31;

	this.funcs_foreach_dart_of[edge] = this.foreach_dart_phi2_phi3;

	this.funcs_foreach_dart_of[face] = this.foreach_dart_phi1_phi3;

	this.funcs_foreach_dart_of[connex] = this.foreach_dart_phi1_phi2_phi3;

	/// OPERATIONS
	this.cut_edge2 = this.cut_edge;
	this.cut_edge = function(ed, set_embeddings = true){
		let d0 = ed;
		let d23 = this.phi3[this.phi2[d0]];
		let vd = this.cut_edge2(d0, false);

		let d3;
		while(d23 != ed){
			d0 = d23;
			d23 = this.phi3[this.phi2[d0]];
			this.cut_edge2(d0, false);
			d3 = this.phi3[d0];
			this.unsew_phi3(d0);
			this.sew_phi3(d0, this.phi1[d3]);
			this.sew_phi3(d3, this.phi1[d0]);
		}
		d3 = this.phi3[ed];
		this.unsew_phi3(ed);
		this.sew_phi3(ed, this.phi1[d3]);
		this.sew_phi3(d3, this.phi1[ed]);

		if(set_embeddings){
			if(this.is_embedded(vertex2)){
				let d = vd;
				do{
					let v2id = this.new_cell(vertex2);
					this.set_embedding(vertex2, d, v2id);
					this.set_embedding(vertex2, this.phi1[this.phi2[d]], v2id);
					d = this.phi3[this.phi2[d]];
				} while(d != vd);
			}
			if(this.is_embedded(edge2)){
				let d = vd;
				do{
					let e2id = this.new_cell(edge2);
					this.set_embedding(edge2, d, e2id);
					this.set_embedding(edge2, this.phi2[d], e2id);
					d = this.phi3[this.phi2[d]];
				}while(d != vd);
			}
			if(this.is_embedded(face2)){

			}
			if(this.is_embedded(volume)){

			}
			if(this.is_embedded(vertex)){
				let vid = this.new_cell(vertex);
				this.foreach_dart_of(vertex, vd, d => {this.set_embedding(vertex, d, vid)});
			}
			if(this.is_embedded(edge)){

			}
			if(this.is_embedded(face)){

			}
			if(this.is_embedded(connex)){
			}
		}
		return vd;
	};

	this.cut_face2 = this.cut_face;
	this.cut_face = function(fd0, fd1, set_embeddings = true){
		let d0 = this.phi1[this.phi3[fd0]];
		let d1 = this.phi1[this.phi3[fd1]];

		this.cut_face2(fd0, fd1, false);
		this.cut_face2(d0, d1, false);

		this.sew_phi3(this.phi_1[fd0], this.phi_1[d1])
		this.sew_phi3(this.phi_1[fd1], this.phi_1[d0])

		let ed = this.phi_1[d0];

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
				this.set_embedding(vertex, this.phi_1[d1], this.cell(vertex, fd0))
				this.set_embedding(vertex, this.phi_1[fd1], this.cell(vertex, fd0))
				this.set_embedding(vertex, this.phi_1[d0], this.cell(vertex, fd1))
				this.set_embedding(vertex, this.phi_1[fd0], this.cell(vertex, fd1))
			}
			if(this.is_embedded(edge)){

			}
			if(this.is_embedded(face)){

			}
			if(this.is_embedded(connex)){
			}
		}
		return ed;
	};

	this.cut_volume = function(path, set_embeddings = true){
		let fd0 = this.add_face(path.length, false);
		let fd1 = this.add_face(path.length, false);

		let d0, d1;
		for(let i = 0; i < path.length; ++i){
			d0 = path[i];
			d1 = this.phi2[d0];
			this.unsew_phi2(d0);

			this.sew_phi2(d0, fd0);
			this.sew_phi2(d1, fd1);
			this.sew_phi3(fd0, fd1);

			fd0 = this.phi_1[fd0];
			fd1 = this.phi1[fd1];
		}
		fd0 = this.phi_1[fd0];

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
				this.foreach_dart_of(face, fd0, d => {
					this.set_embedding(vertex, d, this.cell(vertex, this.phi1[this.phi2[d]]));
				});
			}
			if(this.is_embedded(edge)){

			}
			if(this.is_embedded(face)){

			}
			if(this.is_embedded(connex)){
			}
		}
	};

	this.collapse_edge;
	this.merge_faces;
	this.merge_volumes;

}

export default CMap3;
