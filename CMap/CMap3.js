import CMap2 from './CMap2.js';

function CMap3(){
	CMap2.call(this);

	this.phi3 = this.addTopologyRelation("phi3");
	
	this.vertex2 = this.vertex;
	this.face2 = this.face;
	this.edge2 = this.edge;
	this.vertex = this.addCelltype();
	this.edge = this.addCelltype();
	this.face = this.addCelltype();
	this.connex = this.addCelltype();

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
	this.close_hole = function(d0, boundary = false, setEmbeddings = true) {
		// if(this.phi3[d0] != d0)
		// 	return;

		let visited = this.newMarker();
		let hole = this.newMarker();
		let faces = [d0];
		visited.markCell(face2, d0);

		do {
			let fd0 = faces.shift();

			// codegree of face... to be written 
			let codegree = 0;
			this.foreachDartOf(face2, fd0, d => {
				++codegree;
				visited.mark(d);
			});

			let fd_h = this.addFace(codegree, false);
			hole.markCell(face2, fd_h)

			let fd = fd0;
			do {
				let done = false;
				let d = this.phi3[this.phi2[fd]];
				do {
					if(this.phi3[d] == d){
						done = true;
						if(!visited.marked(d)){
							faces.push(d);
							visited.markCell(this.face2, d);
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
			this.markCellAsBoundary(volume, wd);

		if(setEmbeddings){
			let wid, ccid;
			if(this.isEmbedded(volume))
				wid = this.newCell(volume);
			if(this.isEmbedded(connex))
				ccid = this.cell(connex, d0);

			this.foreachDartOf(volume, wd, d00 => {
				if(this.isEmbedded(vertex2)){
					if(!Number.isInteger(this.cell(vertex2, d00))){
						let v2id = this.newCell(vertex2);
						this.foreachDartOf(vertex2, d00, d1 =>{ this.setEmbedding(vertex2, d1, v2id)});
					}
				}
				if(this.isEmbedded(edge2)){
					if(!Number.isInteger(this.cell(edge2, d00))){
						let e2id = this.newCell(edge2);
						this.foreachDartOf(edge2, d00, d1 =>{ this.setEmbedding(edge2, d1, e2id)});
					}
				}
				if(this.isEmbedded(face2)){
					if(!Number.isInteger(this.cell(face2, d00))){
						let f2id = this.newCell(face2);
						this.foreachDartOf(face2, d00, d1 =>{ this.setEmbedding(face2, d1, f2id)});
					}
				}
				if(wid != undefined){
					this.setEmbedding(volume, d00, wid);
				}
				if(this.isEmbedded(vertex)){
					if(!Number.isInteger(this.cell(vertex, d00))){
						let vid = this.cell(vertex, this.phi1[this.phi3[d00]]);
						this.foreachDartOf(vertex2, d00, d1 =>{ this.setEmbedding(vertex, d1, vid)});
					}
				}
				if(this.isEmbedded(edge)){
					if(!Number.isInteger(this.cell(edge, d00))){
						let eid = this.cell(edge, this.phi3[d00]);
						this.foreachDartOf(edge, d00, d1 =>{ this.setEmbedding(edge, d1, eid)});
					}
				}
				if(this.isEmbedded(face)){
					if(!Number.isInteger(this.cell(face, d00))){
						let eid = this.cell(face, this.phi3[d00]);
						this.foreachDartOf(face, d00, d1 =>{ this.setEmbedding(face, d1, eid)});
					}
				}
				if(ccid != undefined){
					this.setEmbedding(connex, d00, ccid);
				}
			});
		}

		return wd;
	};


	this.close2 = this.close;
	this.close = function(boundary = true, setEmbeddings = true){
		this.foreachDart(d0 => {
			if(this.phi3[d0] == d0)
				this.close_hole(d0, boundary, setEmbeddings);
		});
	};

	/// Traverses and applies func to all darts of face 3
	this.foreachDart_phi1_phi3 = function(d0, func){
		let stop;
		this.foreachDart_phi1(d0, d1 => {
			stop = func(d1);
			return stop;
		});
		if(!stop)
			this.foreachDart_phi1(this.phi3[d0], func);
	};

	/// Traverses and applies func to all darts of edge 3
	this.foreachDart_phi2_phi3 = function(d0, func){
		let d = d0;
		do {
			if(func(d)) break;
			d = this.phi2[d];

			if(func(d)) break;
			d = this.phi3[d];
		} while (d != d0);
	};

	/// Traverses and applies func to all darts of vertex 3
	this.foreachDart_phi21_phi31 = function(d0, func){
		let marker = this.newFastMarker();
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
	this.foreachDart_phi1_phi2_phi3 = function(d0, func){
		let marker = this.newFastMarker();
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

	this.funcsForeachDartOf[vertex] = this.foreachDart_phi21_phi31;

	this.funcsForeachDartOf[edge] = this.foreachDart_phi2_phi3;

	this.funcsForeachDartOf[face] = this.foreachDart_phi1_phi3;

	this.funcsForeachDartOf[connex] = this.foreachDart_phi1_phi2_phi3;

	/// OPERATIONS
	this.cut_edge2 = this.cut_edge;
	this.cut_edge = function(ed, setEmbeddings = true){
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

		if(setEmbeddings){
			if(this.isEmbedded(vertex2)){
				let d = vd;
				do{
					let v2id = this.newCell(vertex2);
					this.setEmbedding(vertex2, d, v2id);
					this.setEmbedding(vertex2, this.phi1[this.phi2[d]], v2id);
					d = this.phi3[this.phi2[d]];
				} while(d != vd);
			}
			if(this.isEmbedded(edge2)){
				let d = vd;
				do{
					let e2id = this.newCell(edge2);
					this.setEmbedding(edge2, d, e2id);
					this.setEmbedding(edge2, this.phi2[d], e2id);
					d = this.phi3[this.phi2[d]];
				}while(d != vd);
			}
			if(this.isEmbedded(face2)){

			}
			if(this.isEmbedded(volume)){

			}
			if(this.isEmbedded(vertex)){
				let vid = this.newCell(vertex);
				this.foreachDartOf(vertex, vd, d => {this.setEmbedding(vertex, d, vid)});
			}
			if(this.isEmbedded(edge)){

			}
			if(this.isEmbedded(face)){

			}
			if(this.isEmbedded(connex)){
			}
		}
		return vd;
	};

	this.cut_face2 = this.cut_face;
	this.cut_face = function(fd0, fd1, setEmbeddings = true){
		let d0 = this.phi1[this.phi3[fd0]];
		let d1 = this.phi1[this.phi3[fd1]];

		this.cut_face2(fd0, fd1, false);
		this.cut_face2(d0, d1, false);

		this.sew_phi3(this.phi_1[fd0], this.phi_1[d1])
		this.sew_phi3(this.phi_1[fd1], this.phi_1[d0])

		let ed = this.phi_1[d0];

		if(setEmbeddings){
			if(this.isEmbedded(vertex2)){

			}
			if(this.isEmbedded(edge2)){

			}
			if(this.isEmbedded(face2)){

			}
			if(this.isEmbedded(volume)){

			}
			if(this.isEmbedded(vertex)){
				this.setEmbedding(vertex, this.phi_1[d1], this.cell(vertex, fd0))
				this.setEmbedding(vertex, this.phi_1[fd1], this.cell(vertex, fd0))
				this.setEmbedding(vertex, this.phi_1[d0], this.cell(vertex, fd1))
				this.setEmbedding(vertex, this.phi_1[fd0], this.cell(vertex, fd1))
			}
			if(this.isEmbedded(edge)){

			}
			if(this.isEmbedded(face)){

			}
			if(this.isEmbedded(connex)){
			}
		}
		return ed;
	};

	this.cut_volume = function(path, setEmbeddings = true){
		let fd0 = this.addFace(path.length, false);
		let fd1 = this.addFace(path.length, false);

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

		if(setEmbeddings){
			if(this.isEmbedded(vertex2)){

			}
			if(this.isEmbedded(edge2)){

			}
			if(this.isEmbedded(face2)){

			}
			if(this.isEmbedded(volume)){

			}
			if(this.isEmbedded(vertex)){
				this.foreachDartOf(face, fd0, d => {
					this.setEmbedding(vertex, d, this.cell(vertex, this.phi1[this.phi2[d]]));
				});
			}
			if(this.isEmbedded(edge)){

			}
			if(this.isEmbedded(face)){

			}
			if(this.isEmbedded(connex)){
			}
		}
	};

	this.collapse_edge;
	this.merge_faces;
	this.merge_volumes;

}

export default CMap3;
