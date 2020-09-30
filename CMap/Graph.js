import CMap_Base from './CMap_Base.js'

function Graph()
{
	CMap_Base.call(this);

	this.alpha0 = this.add_topology_relation("alpha0");
	this.alpha1 = this.add_topology_relation("alpha1");
	this.alpha_1 = this.add_topology_relation("alpha_1");
	this.phi1 = this.alpha0;

	this.sew_alpha0 = function(d0, d1){
		this.alpha0[d0] = d1;
		this.alpha0[d1] = d0;
	};

	this.unsew_alpha0 = function(d0){
		const d1 = this.alpha0[d0];
		this.alpha0[d0] = d0;
		this.alpha0[d1] = d1;
	};

	this.sew_alpha1 = function(d0, e0){
		const d1 = this.alpha1[d0];
		const e1 = this.alpha1[e0];
		this.alpha1[d0] = e1;
		this.alpha1[e0] = d1;
		this.alpha_1[d1] = e0;
		this.alpha_1[e1] = d0;
	};

	this.unsew_alpha1 = function(d0){
		const d1 = this.alpha1[d0];
		const d_1 = this.alpha_1[d0];

		this.alpha1[d0] = d0;
		this.alpha_1[d0] = d0;
		this.alpha1[d_1] = d1;
		this.alpha_1[d1] = d_1;
	};

	this.foreach_dart_alpha0 = function(d0, func){
		if(!func(d0))
			func(this.alpha0[d0]);
	};

	this.foreach_dart_alpha1 = function(d0, func){
		let d = d0;
		do{
			if(func(d)) break;
			d = this.alpha1[d];
		} while(d != d0)
	};

	this.vertex = this.add_celltype();

	this.funcs_set_embeddings[this.vertex] = function(){
		if(!this.is_embedded(this.vertex))
			this.create_embedding(this.vertex);

		this.foreach(this.vertex, vd => {
			let vid = this.new_cell(this.vertex);
			this.foreach_dart_alpha1(vd, d => {
				this.set_embedding(this.vertex, d, vid);
			});
		});
	};

	this.funcs_foreach[this.vertex] = function(func, cache){
		if(cache){
			cache.some(d => func(d));
			return;
		}

		let marker = this.new_marker();
		this.foreach_dart(d => {
			if(marker.marked(d))
				return;

			this.foreach_dart_alpha1(d, d1 => {marker.mark(d1)});
			return func(d);
		});
		marker.delete();
	};

	this.funcs_foreach_dart_of[this.vertex] = function(vd, func) {
		this.foreach_dart_alpha1(vd, d => {func(d)});
	};


	this.edge = this.add_celltype();

	this.funcs_set_embeddings[this.edge] = function(){
		if(!this.is_embedded(this.edge))
			this.create_embedding(this.edge);

		this.foreach(this.edge, ed => {
			let eid = this.new_cell(this.edge);
			this.foreach_dart_alpha0(ed, d => {
				this.set_embedding(this.edge, d, eid);
			});
		});
	};

	this.funcs_foreach[this.edge] = function(func, cache){
		if(cache){
			cache.some(d => func(d));
			return;
		}

		let marker = this.new_marker();
		this.foreach_dart( d => {
			if(this.alpha0[d] == d || marker.marked(d))
				return;
			console.log
			this.foreach_dart_alpha0(d, d1 => {marker.mark(d1)});
			return func(d);
		});
		marker.delete();
	};

	this.funcs_foreach_dart_of[this.edge] = function(ed, func) {
		this.foreach_dart_alpha0(ed, d => {func(d)});
	};

	this.add_vertex = function(set_embeddings = true){
		let d = this.new_dart();
		if(set_embeddings){
			if(this.is_embedded(this.vertex))
				this.set_embedding(this.vertex, d, this.new_cell(this.vertex));
		}
		return d;
	};

	this.delete_vertex = function(vd0, set_embeddings = true){
		let vd1 = this.alpha1[vd0];
		while(vd1 != vd0){
			let vd_1 = vd1;
			vd1 = this.alpha1[vd1];
			this.disconnect_vertices(this.alpha0[vd_1], vd_1, set_embeddings);
		}
		this.disconnect_vertices(this.alpha0[vd0], vd0, set_embeddings);
		this.delete_dart(vd0);
	};

	this.connect_vertices = function(d0, e0, set_embeddings = true){
		let d = (this.alpha0[d0] == d0)? d0 : this.new_dart(); 
		let e = (this.alpha0[e0] == e0)? e0 : this.new_dart();
		if(d != d0) this.sew_alpha1(d0, d);
		if(e != e0) this.sew_alpha1(e0, e);

		this.sew_alpha0(d, e);

		if(set_embeddings){
			if(this.is_embedded(this.vertex)){
				if(d != d0) this.set_embedding(this.vertex, d, this.cell(this.vertex, d0));
				if(e != e0) this.set_embedding(this.vertex, e, this.cell(this.vertex, e0));
			}
			if(this.is_embedded(this.edge)){
				let eid = this.new_cell(this.edge);
				this.set_embedding(this.edge, d, eid);
				this.set_embedding(this.edge, e, eid);
			}
		}

		return d;
	};
	
	this.disconnect_vertices = function(vd0, vd1, set_embeddings = true){
		let val0 = 0;
		this.foreach_dart_alpha1(vd0, d => {if(this.alpha0[d] != vd0) ++val0;});
		let val1 = 0;
		this.foreach_dart_alpha1(vd1, d => {if(this.alpha0[d] != vd1) ++val1;});
		this.unsew_alpha0(vd0);

		if(set_embeddings){
			if(this.is_embedded(this.edge)){
				let eid = this.cell(this.edge, d0);
				this.delete_cell(this.edge, eid);
			}
		}

		if(val0 > 1) {
				this.unsew_alpha1(vd0);
				this.delete_dart(vd0);
			}
		if(val1 > 1){
				this.unsew_alpha1(vd1);
				this.delete_dart(vd1);
			}
	};

	this.cut_edge = function(ed, set_embeddings = true){
		let ed0 = ed;
		let ed1 = this.alpha0[ed];

		let vd0 = this.new_dart();
		let vd1 = this.new_dart();

		this.sew_alpha1(vd0, vd1);
		this.unsew_alpha0(ed0);
		this.sew_alpha0(ed0, vd0);
		this.sew_alpha0(ed1, vd1);

		if(set_embeddings){
			if(this.is_embedded(this.vertex)){
				let vid = this.new_cell(this.vertex);
				this.set_embedding(this.vertex, vd0, vid);
				this.set_embedding(this.vertex, vd1, vid);
			}
			if(this.is_embedded(this.edge)){
				this.set_embedding(this.edge, vd0, this.cell(this.edge, ed0));
				let eid = this.new_cell(this.edge);
				this.set_embedding(this.edge, vd1, eid);
				this.set_embedding(this.edge, ed1, eid);
			}
		}

		return vd0;
	};

	this.collapse_edge = function(ed, set_embeddings = true){
		let d0 = this.alpha0[ed];
		let d1 = this.alpha1[d0];
		while(d1 != d0){
			let d2 = this.alpha1[d1];
			this.unsew_alpha1(d1);
			this.sew_alpha1(d1, ed);
			d1 = d2;
		}

		if(set_embeddings){
			if(this.is_embedded(this.vertex)){
				let eid = this.cell(this.vertex, ed);
				this.foreach_dart_alpha1(ed, d => {
					this.set_embedding(this.vertex, d, eid);
				});
			}
		}
		this.delete_dart(d0);
		this.delete_dart(ed);
	};

	this.merge_edges = function(vd, set_embeddings = true){
		if(this.degree(this.vertex, vd) != 2) 
			return;

		let d0 = vd;
		let d1 = this.alpha1[d0];

		let e0 = this.alpha0[d0];
		let e1 = this.alpha0[d1];
		this.unsew_alpha0(d0);
		this.unsew_alpha0(d1);
		this.sew_alpha0(e0, e1);
		
		this.delete_dart(d0);
		this.delete_dart(d1);

		if(set_embeddings){
			if(this.is_embedded(this.edge)){
				let eid = this.cell(this.edge, e0);
				this.set_embedding(this.edge, e1, eid);
			}
		}
	};
}

export default Graph;