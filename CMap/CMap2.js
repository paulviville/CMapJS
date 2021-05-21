import CMap1 from './CMap1.js';

function CMap2(){
	CMap1.call(this);

	// TOPOLOGY
	this.phi2 = this.addTopologyRelation("phi2");
	this.phis["2"] = this.phi2;
	
	const vertex = this.vertex;
	const edge = this.edge;
	const face = this.face;
	this.volume = this.addCelltype();
	const volume = this.volume;
	
	this.sewPhi2 = function(d0, d1){
		this.phi2[d0] = d1;
		this.phi2[d1] = d0;
	};

	this.unsewPhi2 = function(d){
		let d1 = this.phi2[d];
		this.phi2[d] = d;
		this.phi2[d1] = d1;
	};

	this.closeHole = function(d0, boundary = false, setEmbeddings = true) {
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
			this.sewPhi2(fd, path[i]);
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
	const closeHole = this.closeHole.bind(this);

	this.close = function(boundary = false, setEmbeddings = true){
		this.foreachDart(d0 => {
			closeHole(d0, boundary, setEmbeddings);
		});
	};

	// ORBITS
	/// Traverses and applies func to all darts of edge 2
	this.foreachDartPhi2 = function(d, func){
		if(!func(d))
			func(this.phi2[d]);	
	};

	/// Traverses and applies func to all darts of vertex 2
	this.foreachDartPhi21 = function(d0, func){
		let d = d0;
		do {
			if(func(d)) break;
			d = this.phi1[this.phi2[d]];
		} while (d != d0);
	};

	/// Traverses and applies func to all darts of volume
	this.foreachDartPhi1Phi2 = function(d0, func){
		let marker = this.newMarker();
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

	this.funcsForeachDartOf[vertex] = this.foreachDartPhi21;

	this.funcsForeachDartOf[edge] = this.foreachDartPhi2;

	this.funcsForeachDartOf[volume] = this.foreachDartPhi1Phi2;

	// OPERATIONS
	this.cutEdge1 = this.cutEdge;
	this.cutEdge = function(ed, setEmbeddings = true){
		let d0 = ed;
		let e0 = this.phi2[d0];
		this.unsewPhi2(d0);

		let d1 = this.cutEdge1(d0, false);
		let e1 = this.cutEdge1(e0, false);

		this.sewPhi2(d0, e1);
		this.sewPhi2(e0, d1);	

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

	this.collapseEdge1 = this.collapseEdge;
	this.collapseEdge = function(ed, setEmbeddings = true){
		let d0 = ed;
		let e0 = this.phi2[ed];
		// let eid = this.cell(edge, ed);
		
		this.unsewPhi2(d0);
		let d1 = this.collapseEdge1(d0, false);
		let e1 = this.collapseEdge1(e0, false);
		
		if(setEmbeddings){
			if(this.isEmbedded(vertex)){
				let vid0 = this.cell(vertex, d1);
				let vid1 = this.cell(vertex, e1);
				this.foreachDartPhi21(e1,d => {
					this.setEmbedding(vertex, d, vid0);
				});
				this.deleteCell(vertex, vid1); // should remove this and test
			}
		}
		
		return d1;
	};

	this.splitVertex1 = this.splitVertex;
	this.splitVertex = function(vd0, vd1, setEmbeddings = true){
		let d0 = this.splitVertex1(vd0, false);
		let d1 = this.splitVertex1(vd1, false);

		this.sewPhi2(d0, d1);

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

	this.cutFace = function(fd0, fd1, setEmbeddings = true){
		let d0 = this.phi_1[fd0];
		let d1 = this.phi_1[fd1];

		let e0 = this.newDart();
		let e1 = this.newDart();
		this.sewPhi2(e0, e1);
		this.sewPhi1(d0, e0);
		this.sewPhi1(d1, e1);
		this.sewPhi1(e0, e1);

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
				this.foreachDartPhi1(e1, d => {
					this.setEmbedding(face, d, fid);
				});
			}
		}

		return e0;
	};

	this.mergeFaces = function(ed, setEmbeddings = true){
		let fd = this.phi1[ed];
		let d0 = ed, 
			d1 = this.phi2[ed];

		this.sewPhi1(this.phi_1[d0], d1);
		this.sewPhi1(this.phi_1[d1], d0);

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


	this.flipEdge = function(ed, setEmbeddings = true){
		let d0 = ed,
			d1 = this.phi1[d0],
			e0 = this.phi2[ed],
			e1 = this.phi1[e0];

		this.sewPhi1(this.phi_1[d0], e0);
		this.sewPhi1(this.phi_1[e0], d0);

		this.sewPhi1(e0, e1);
		this.sewPhi1(d0, d1);

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
	// this.addFace = function(nbSides, setEmbeddings = true){

	// }

	this.addPrism = function(size = 3, setEmbeddings = true) {
		let d0 = this.addFace(4, false);
		let d1 = d0;
		for(let i = 1; i < size; ++i){
			let fd = this.addFace(4, false);
			this.sewPhi2(this.phi1[d1], this.phi_1[fd]);
			d1 = fd;
		}
		this.sewPhi2(this.phi_1[d0], this.phi1[d1]);
		let d_base = closeHole(d0, false, false);
		closeHole(this.phi1[this.phi1[d0]]);

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

	this.addPyramid = function(size = 3, setEmbeddings = true) {
		let d0 = this.addFace(3, false);
		let d1 = d0;
		for(let i = 1; i < size; ++i){
			let fd = this.addFace(3, false);
			this.sewPhi2(this.phi1[d1], this.phi_1[fd]);
			d1 = fd;
		}
		this.sewPhi2(this.phi_1[d0], this.phi1[d]);
		let d_base = this.closeHole(d0, false, false);

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
