import CMap1 from './CMap1.js';

function CMap2(){
	CMap1.call(this);

	// TOPOLOGY
	this.phi2 = this.addTopologyRelation("phi2");
	
	const vertex = this.vertex;
	const edge = this.edge;
	const face = this.face;
	this.volume = this.addCelltype();
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

	this.close_hole = function(d0, boundary = false, setEmbeddings = true) {
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
		
		let fd = this.addFace(path.length, false);
		if(boundary)
			this.markCellAsBoundary(face, fd);
		for(let i = 0; i < path.length; ++i){
			this.sew_phi2(fd, path[i]);
			fd = this.phi_1[fd];
		}

		if(setEmbeddings){
			let fid = this.isEmbedded(face)? this.newCell(face) : undefined;
			this.foreachDartOf(face, fd, d => {
				if(this.isEmbedded(vertex))
					this.setEmbedding(vertex, d, this.cell(vertex, this.phi1[this.phi2[d]]));
				if(this.isEmbedded(edge))
					this.setEmbedding(edge, d, this.cell(edge, this.phi2[d]));
				if(this.isEmbedded(face))
					this.setEmbedding(face, d, fid);
			});
		}

		return fd;
	}
	const close_hole = this.close_hole.bind(this);

	this.close = function(boundary = false, setEmbeddings = true){
		this.foreachDart(d0 => {
			close_hole(d0, boundary, setEmbeddings);
		});
	};

	// ORBITS
	/// Traverses and applies func to all darts of edge 2
	this.foreachDart_phi2 = function(d, func){
		if(!func(d))
			func(this.phi2[d]);	
	};

	/// Traverses and applies func to all darts of vertex 2
	this.foreachDart_phi21 = function(d0, func){
		let d = d0;
		do {
			if(func(d)) break;
			d = this.phi1[this.phi2[d]];
		} while (d != d0);
	};

	/// Traverses and applies func to all darts of volume
	this.foreachDart_phi1_phi2 = function(d0, func){
		let marker = this.newFastMarker();
		let faces = [d0];
		do {
			let fd = faces.shift();
			if(marker.marked(fd))
				continue;

			let d = fd;
			do {
				if(func(d))
					return;
				marker.mark(d);
				let adj = this.phi2[d];
				if(!marker.marked(adj)){
					faces.push(adj);
				}
				d = this.phi1[d];
			} while (d != fd);
		} while(faces.length);

	};

	this.funcsForeachDartOf[vertex] = this.foreachDart_phi21;

	this.funcsForeachDartOf[edge] = this.foreachDart_phi2;

	this.funcsForeachDartOf[volume] = this.foreachDart_phi1_phi2;

	// OPERATIONS
	this.cut_edge1 = this.cut_edge;
	this.cut_edge = function(ed, setEmbeddings = true){
		let d0 = ed;
		let e0 = this.phi2[d0];
		this.unsew_phi2(d0);

		let d1 = this.cut_edge1(d0, false);
		let e1 = this.cut_edge1(e0, false);

		this.sew_phi2(d0, e1);
		this.sew_phi2(e0, d1);	

		if(setEmbeddings){
			if(this.isEmbedded(vertex)){
				let vid = this.newCell(vertex);
				this.setEmbedding(vertex, d1, vid);
				this.setEmbedding(vertex, e1, vid);
			}
			if(this.isEmbedded(edge)){
				let eid = this.newCell(edge);
				this.setEmbedding(edge, d1, this.cell(edge, e0));
				this.setEmbedding(edge, e1, eid);
				this.setEmbedding(edge, d0, eid);
			}
			if(this.isEmbedded(face)){
				this.setEmbedding(face, d1, this.cell(face, d0));
				this.setEmbedding(face, e1, this.cell(face, e0));
			}
		}

		return d1;
	};

	this.collapse_edge1 = this.collapse_edge;
	this.collapse_edge = function(ed, setEmbeddings = true){
		let d0 = ed;
		let e0 = this.phi2[ed];
		// let eid = this.cell(edge, ed);
		
		this.unsew_phi2(d0);
		let d1 = this.collapse_edge1(d0, false);
		let e1 = this.collapse_edge1(e0, false);
		
		if(setEmbeddings){
			if(this.isEmbedded(vertex)){
				let vid0 = this.cell(vertex, d1);
				let vid1 = this.cell(vertex, e1);
				this.foreachDart_phi21(e1,d => {
					this.setEmbedding(vertex, d, vid0);
				});
				this.deleteCell(vertex, vid1); // should remove this and test
			}
		}
		
		return d1;
	};

	this.split_vertex1 = this.split_vertex;
	this.split_vertex = function(vd0, vd1, setEmbeddings = true){
		let d0 = this.split_vertex1(vd0, false);
		let d1 = this.split_vertex1(vd1, false);

		this.sew_phi2(d0, d1);

		if(setEmbeddings){
			if(this.isEmbedded(vertex)){
				let vid = this.newCell(vertex);
				this.foreachDartOf(vertex, d0, d => {
					this.setEmbedding(vertex, d, vid);
				});
				this.setEmbedding(vertex, d1, this.cell(vertex, vd0));
			}
			if(this.isEmbedded(edge)){
				let eid = this.newCell(edge);
				this.setEmbedding(edge, d0, eid);
				this.setEmbedding(edge, d1, eid);
			}
			if(this.isEmbedded(face)){
				this.setEmbedding(face, d0, this.cell(face, vd0));
				this.setEmbedding(face, d1, this.cell(face, vd1));
			}
		}

		return d0;
	};

	this.cut_face = function(fd0, fd1, setEmbeddings = true){
		let d0 = this.phi_1[fd0];
		let d1 = this.phi_1[fd1];

		let e0 = this.newDart();
		let e1 = this.newDart();
		this.sew_phi2(e0, e1);
		this.sew_phi1(d0, e0);
		this.sew_phi1(d1, e1);
		this.sew_phi1(e0, e1);

		if(this.isBoundaryCell(face, fd0))
			this.markCellAsBoundary(edge, e0);

		if(setEmbeddings){
			if(this.isEmbedded(vertex)){
				this.setEmbedding(vertex, e0, this.cell(vertex, this.phi1[this.phi2[e0]]));
				this.setEmbedding(vertex, e1, this.cell(vertex, this.phi1[this.phi2[e1]]));
			}
			if(this.isEmbedded(edge)){
				let eid = this.newCell(edge);
				this.setEmbedding(edge, e0, eid);
				this.setEmbedding(edge, e1, eid);
			}
			if(this.isEmbedded(face)){
				this.setEmbedding(face, e0, this.cell(face, this.phi1[e0]));
				let fid = this.newCell(face);
				this.foreachDart_phi1(e1, d => {
					this.setEmbedding(face, d, fid);
				});
			}
		}

		return e0;
	};

	this.merge_faces = function(ed, setEmbeddings = true){
		let fd = this.phi1[ed];
		let d0 = ed, 
			d1 = this.phi2[ed];

		this.sew_phi1(this.phi_1[d0], d1);
		this.sew_phi1(this.phi_1[d1], d0);

		if(setEmbeddings){
			if(this.isEmbedded(face)){
				let fid0 = this.cell(face, d0);
				this.foreachDartOf(face, fd, d => {
					this.setEmbedding(face, d, fid0);
				});
			}
		}

		this.deleteDart(d0);
		this.deleteDart(d1);
	};


	this.flip_edge = function(ed, setEmbeddings = true){
		let d0 = ed,
			d1 = this.phi1[d0],
			e0 = this.phi2[ed],
			e1 = this.phi1[e0];

		this.sew_phi1(this.phi_1[d0], e0);
		this.sew_phi1(this.phi_1[e0], d0);

		this.sew_phi1(e0, e1);
		this.sew_phi1(d0, d1);

		if(setEmbeddings){
			if(this.isEmbedded(vertex)){
				this.setEmbedding(vertex, d0, this.cell(vertex, this.phi1[e0]));
				this.setEmbedding(vertex, e0, this.cell(vertex, this.phi1[d0]));
			}
			if(this.isEmbedded(face)){
				this.setEmbedding(face, this.phi_1[d0], this.cell(face, d0));
				this.setEmbedding(face, this.phi_1[e0], this.cell(face, e0));
			}
		}

		return ed;
	};

	this.addFace1 = this.addFace;
	// this.addFace = function(nb_sides, setEmbeddings = true){

	// }

	this.add_prism = function(size = 3, setEmbeddings = true) {
		let d0 = this.addFace(4, false);
		let d1 = d0;
		for(let i = 1; i < size; ++i){
			let fd = this.addFace(4, false);
			this.sew_phi2(this.phi1[d1], this.phi_1[fd]);
			d1 = fd;
		}
		this.sew_phi2(this.phi_1[d0], this.phi1[d1]);
		let d_base = close_hole(d0, false, false);
		close_hole(this.phi1[this.phi1[d0]]);

		if(setEmbeddings){
			this.foreachDartOf(volume, d_base, d => {
				if(this.isEmbedded(vertex)){
					if(this.cell(vertex, d) == undefined){
						let vid = this.newCell(vertex);
						this.foreachDartOf(vertex, d, d2 => {
							this.setEmbedding(vertex, d2, vid);
						});
					}
				}
				if(this.isEmbedded(edge)){
					if(this.cell(edge, d) == undefined){
						let eid = this.newCell(edge);
						this.foreachDartOf(edge, d, d2 => {
							this.setEmbedding(edge, d2, eid);
						});
					}
				}
				if(this.isEmbedded(face)){
					if(this.cell(face, d) == undefined){
						let fid = this.newCell(face);
						this.foreachDartOf(face, d, d2 => {
							this.setEmbedding(face, d2, fid);
						});
					}
				}
				if(this.isEmbedded(volume)){
					if(this.cell(volume, d) == undefined){
						let wid = this.newCell(volume);
						this.foreachDartOf(volume, d, d2 => {
							this.setEmbedding(volume, d2, wid);
						});
					}
				}
			});
		}

		return d_base;
	};

	this.add_pyramid = function(size = 3, setEmbeddings = true) {
		let d0 = this.addFace(3, false);
		let d1 = d0;
		for(let i = 1; i < size; ++i){
			let fd = this.addFace(3, false);
			this.sew_phi2(this.phi1[d1], this.phi_1[fd]);
			d1 = fd;
		}
		this.sew_phi2(this.phi_1[d0], this.phi1[d]);
		let d_base = this.close_hole(d0, false, false);

		if(setEmbeddings){
			this.foreachDartOf(volume, d_base, d => {
				if(this.isEmbedded(vertex)){
					if(this.cell(vertex, d) == undefined){
						let vid = this.newCell(vertex);
						this.foreachDartOf(vertex, d, d2 => {
							this.setEmbedding(vertex, d2, vid);
						});
					}
				}
				if(this.isEmbedded(edge)){
					if(this.cell(edge, d) == undefined){
						let eid = this.newCell(edge);
						this.foreachDartOf(edge, d, d2 => {
							this.setEmbedding(edge, d2, eid);
						});
					}
				}
				if(this.isEmbedded(face)){
					if(this.cell(face, d) == undefined){
						let fid = this.newCell(face);
						this.foreachDartOf(face, d, d2 => {
							this.setEmbedding(face, d2, fid);
						});
					}
				}
				if(this.isEmbedded(volume)){
					if(this.cell(volume, d) == undefined){
						let wid = this.newCell(volume);
						this.foreachDartOf(volume, d, d2 => {
							this.setEmbedding(volume, d2, wid);
						});
					}
				}
			});
		}

		return d_base;
	};
}

export default CMap2;
