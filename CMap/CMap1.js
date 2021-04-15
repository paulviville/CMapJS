import CMap0 from './CMap0.js';

function CMap1()
{
	CMap0.call(this);
	
	this.phi1 = this.addTopologyRelation("phi1");
	this.phi_1 = this.addTopologyRelation("phi_1");

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
	this.foreachDart_phi1 = function(d0, func){
		let d = d0;
		do
		{
			if(func(d)) return;
				d = this.phi1[d];
		} while (d != d0);
	};


	// ORBITS
	const vertex = this.vertex;

	this.edge = this.addCelltype();
	const edge = this.edge;

	this.funcsForeachDartOf[edge] = function(ed, func) {func(ed)};

	this.face = this.addCelltype();
	const face = this.face;

	this.funcsForeachDartOf[face] = this.foreachDart_phi1;

	// OPERATIONS
	this.addFace = function(nb_sides, setEmbeddings = true){
		let d0 = this.newDart();
		for(let i = 1; i < nb_sides; i++){
			let d1 = this.newDart();
			this.sew_phi1(d0, d1);
		}

		if(setEmbeddings){
			if(this.isEmbedded(vertex))
				this.foreachDart_phi1(d0, d1 => {
					this.setEmbedding(vertex, d1, this.newCell(vertex));
				});
			if(this.isEmbedded(edge))
				this.foreachDart_phi1(d0, d1 => {
					this.setEmbedding(edge, d1, this.newCell(edge));
				});
			if(this.isEmbedded(face)){
				let fid = this.newCell(face);
				this.foreachDart_phi1(d0, d1 => {
					this.setEmbedding(face, d1, fid);
				});
			}
		}

		return d0;
	};

	this.cut_edge = function(ed, setEmbeddings = true){
		let d0 = ed;
		let d1 = this.newDart();

		this.sew_phi1(d0, d1);

		if(this.isBoundary(d0))
			this.markAsBoundary(d1);

		if(setEmbeddings){
			if(this.isEmbedded(vertex))
				this.setEmbedding(vertex, d1, this.newCell(vertex));
			if(this.isEmbedded(edge))
				this.setEmbedding(edge, d1, this.newCell(edge));
			if(this.isEmbedded(face))
				this.setEmbedding(face, d1, this.newCell(face));
		}

		return d1;
	};

	this.collapse_edge = function(ed, setEmbeddings = true){
		let d0 = this.phi_1[ed];
		this.unsew_phi1(d0);
		let d1 = this.phi1[d0];

		this.deleteDart(ed);
		return d1;
	};

	this.split_vertex = function(vd, setEmbeddings = true){
		let d0 = this.phi_1(vd);
		let d1 = this.newDart();

		this.sew_phi1(d0, d1);

		if(this.isBoundary(d0))
			this.markAsBoundary(d1);

		if(setEmbeddings){
			if(this.isEmbedded(vertex))
				this.setEmbedding(vertex, d1, this.newCell(vertex));
			if(this.isEmbedded(edge))
				this.setEmbedding(edge, d1, this.newCell(edge));
			if(this.isEmbedded(face))
				this.setEmbedding(face, d1, this.cell(face, d0));
		}

		return d1;
	};
}

export default CMap1;
