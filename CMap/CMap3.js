import CMap2 from './CMap2.js';

function CMap3(){
	CMap2.call(this);

	this.phi3 = this.add_topology_relation("phi3");
	
	this.connex = this.add_celltype();

	this.sew_phi3 = function(d0, d1){
		this.phi3[d0] = d1;
		this.phi3[d1] = d0;
	};

	this.unsew_phi3 = function(d){
		let d1 = this.phi3[d];
		this.phi3[d] = d;
		this.phi3[d1] = d1;
	};

// // 	//add foreach dart of phi23
// // 	//add foreach dart of phi13
// // 	//add foreach dart of phi1_phi2_phi3
}

export default CMap3;
