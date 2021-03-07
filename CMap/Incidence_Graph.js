import Attributes_Container from './Attribute_Container.js';

/// Base Structure for CMaps, further extended and specialized later
function Incidence_Graph(){
	/// Attribute containers for all cell types
	const attributes_containers = [];
	// /// Dart topological relations
	// const topology = {};
	/// Cell embeddings
	const embeddings = [];
	/// stored markers
	this.stored_markers = [];
	// /// Cells
	// const cells = [];

	/// All cell types dart traversor functions
	this.funcs_foreach = [];
	/// All cell types incident traversors functions
	this.funcs_foreach_incident = [];

	/// Creates a new cell type by adding an attribute container to the map
	this.add_celltype = function(){
		const emb = attributes_containers.length;
		attributes_containers[emb] = new Attributes_Container();
		this.funcs_foreach_incident[emb] = [];
		this.stored_markers[emb] = [];		
		return emb;
	};

	/// Adds an attribute to given embedding
	this.add_attribute = function(emb, name){
		return attributes_containers[emb].create_attribute(name)	
	};

	/// Gets attribute of given embedding and name if it exists
	this.get_attribute = function(emb, name){	
		return attributes_containers[emb].get_attribute(name)	
	};

	/// Deletes given attribute 
	this.remove_attribute = function(emb, attrib){	
		attributes_containers[emb].remove_attribute(attrib.name)	
	};

	/// Creates a new cell of given embedding
	this.new_cell = function(emb){	
		let c = attributes_containers[emb].new_element();
		embeddings[emb][c] = c;
		return c;
	};

	/// Counts cells of given type
	this.nb_cells = function(emb){
		let i = 0;
		this.foreach(emb, c => {++i}, {use_emb: this.is_embedded(emb)});
		return i;
	};

	/// Deletes given cell
	this.delete_cell = function(emb, e){	
		attributes_containers[emb].delete_element(e);
		embeddings[emb][e] = -1;
	};

	/// Adds new embedding for cell
	this.create_embedding = function(emb){	
		if(!embeddings[emb])	
			embeddings[emb] = this.add_attribute(emb, "<emb_" + emb + ">")	
	};

	/// Verifies cell type embedding
	this.is_embedded = function(emb){	
		return (embeddings[emb]? true : false);
	};

	/// Gets cell embedding of the cell type - for renderer compatibility
	this.cell = function(emb, c){
		return embeddings[emb][c];
	};

	// /// Sets given embedding to given dart
	// this.set_embedding = function(emb, d, i){
	// 	attributes_containers[emb].ref(i);
	// 	attributes_containers[emb].unref(embeddings[emb][d]);	
	// 	return embeddings[emb][d] = i;
	// };

	/// Traverses and applies func to all cells (of map or cache) of given celltype
	this.foreach = function(emb, func, {cache, use_emb} =  {cache: undefined, use_emb: undefined}){
		if(cache){
			cache.forEach(c => func(c));
			return;
		}

		embeddings[emb].some(c => (c != -1) ? func(c) : undefined);
	};

	// /// Traverses incident cells of  given type
	// /// inc_emb : incident cell type
	// /// cell_emb : targete cell type
	// /// cd : target cell
	// /// Use_embedding switches to cell marker instead of darts
	this.foreach_incident = function(inc_emb, cell_emb, c, func){
		this.funcs_foreach_incident[cell_emb][inc_emb](c, func);
	};

	/// Stores all cells of given type in an array
	this.cache = function(emb, cond){
		let cache = [];

		if(!cond)
			this.foreach(emb, c => { cache.push(c) });
		else
			this.foreach(emb, c => { if(cond(c)) cache.push(c) });
			
		return cache;
	};

	/// Clears all data
	this.delete_map = function(){
		attributes_containers.forEach(ac => ac.delete());
		Object.keys(this).forEach(key => delete this[key]);
	};


	// /// Returns a dart marker or a cell marker of given embedding 
	// this.new_marker = function(used_emb){
	// 	if(this.stored_markers[used_emb? used_emb : this.dart].length)
	// 		return this.stored_markers[used_emb? used_emb : this.dart].pop();

	// 	return new Marker(this, used_emb);
	// };

	// // Garbage to fix
	// this.degree = function(emb, cd){
	// 	let deg = 0;
	// 	this.foreach_dart_of(emb, cd, d => {
	// 		++deg;
	// 	});
	// 	return deg;
	// };

	this.debug = function(){
		console.log(attributes_containers, embeddings);
	};

	this.vertex = this.add_celltype();
	this.create_embedding(this.vertex);
	const incident_edges_to_vertex = this.add_attribute(this.vertex, "incident_edges"); 
	
	this.edge = this.add_celltype();
	this.create_embedding(this.edge);
	const incident_vertices_to_edge = this.add_attribute(this.edge, "incident_vertices"); 
	const incident_faces_to_edge = this.add_attribute(this.edge, "incident_faces"); 
	
	this.face = this.add_celltype();
	this.create_embedding(this.face);
	const incident_edges_to_face = this.add_attribute(this.face, "incident_edges"); 

	this.funcs_foreach_incident[this.vertex][this.edge] = function (v, func) {
		incident_edges_to_vertex[v].forEach(e => {func(e);});
	};

	this.funcs_foreach_incident[this.vertex][this.face] = function (v, func) {
		let marker = new Set;
		incident_edges_to_vertex[v].forEach(e => {
			incident_faces_to_edge[e].forEach(f => {
				if(!marker.has(f)) {
					marker.add(f);
					func(f);
				}
			});
		});
	};

	this.funcs_foreach_incident[this.edge][this.vertex] = function (e, func) {
		func(incident_vertices_to_edge[e].v0);			
		func(incident_vertices_to_edge[e].v1);			
	};

	this.funcs_foreach_incident[this.edge][this.face] = function (e, func) {
		incident_faces_to_edge[e].forEach(f => {
			func(f);
		});
	};

	this.funcs_foreach_incident[this.face][this.vertex] = function (f, func) {
		let marker = new Set;
		incident_edges_to_face[f].forEach(e => {	
			if(!marker.has(incident_vertices_to_edge[e].v0)) {
				marker.add(incident_vertices_to_edge[e].v0);
				func(incident_vertices_to_edge[e].v0);
			}
			if(!marker.has(incident_vertices_to_edge[e].v1)) {
				marker.add(incident_vertices_to_edge[e].v1);
				func(incident_vertices_to_edge[e].v1);
			}
		});
	
	};

	this.funcs_foreach_incident[this.face][this.edge] = function (f, func) {
		incident_edges_to_face[f].forEach(e => {func(e)});
	};

	this.add_vertex = function () {
		let v = this.new_cell(this.vertex);
		incident_edges_to_vertex[v] = new Set;
		
		return v;
	};

	this.delete_vertex = function (v) {
		this.foreach_incident(this.edge, this.vertex, v, e => {this.delete_edge(e)});
		this.delete_cell(this.vertex, v);
	};

	this.add_edge = function(v0, v1) {
		let e = this.new_cell(this.edge);
		incident_vertices_to_edge[e] = {v0, v1};
		console.log(incident_vertices_to_edge[e]);
		incident_edges_to_vertex[v0].add(e);
		incident_edges_to_vertex[v1].add(e);
		incident_faces_to_edge[e] = new Set;
		return e;
	};
	
	this.delete_edge = function(e) {
		this.foreach_incident(this.face, this.edge, e, f => {
			this.delete_face(f);
		});
		this.foreach_incident(this.vertex, this.edge, e, v => {
			incident_edges_to_vertex[v].delete(e);
		});
		this.delete_cell(this.edge, e);
	};

	function sort_edges(sorted, unsorted) {
		sorted.push(unsorted.pop());
		const v0 = incident_vertices_to_edge[sorted[0]].v0;
		let v = incident_vertices_to_edge[sorted[0]].v1;
		while(unsorted.length) {
			let i, end;
			for(i = 0, end = unsorted.length; i < unsorted.length; ++i) {
				const e = unsorted[i];
				const evs = incident_vertices_to_edge[e];
				const ev = ( evs.v0 == v ? 
					evs.v1 : ( evs.v1 == v ?
						 evs.v0 : undefined )
				);
				if( ev != undefined ) {
					v = ev;
					sorted.push(unsorted[i]);
					unsorted.splice(i, 1);
					break;
				}
			}
			if (v == v0 || i == end)
				break;
		}

		return (unsorted.length == 0);
	}

	this.add_face = function(...edges) {
		let sorted = []
		if(sort_edges(sorted, edges)) {
			let f = this.new_cell(this.face);
			incident_edges_to_face[f] = sorted;
			sorted.forEach(e => {incident_faces_to_edge[e].add(f);});
			return f;
		}
	};

	this.delete_face = function(f) {
		this.foreach_incident(this.edge, this.face, f, e => {
			incident_faces_to_edge[e].delete(f);
		});
		this.delete_cell(this.face, f);
	};
}

// let Cell_Marker_Proto = {
// 	cmap: undefined, 
// 	emb: undefined,

// 	mark: function(d) {this[this.cmap.cell(this.emb, d)] = true},
// 	unmark: function(d) {this[this.cmap.cell(this.emb, d)] = false},
// 	marked: function(d) {return this[this.cmap.cell(this.emb, d)]},
// };

// let Marker_remover = {
// 	remove: function(){
// 		this.fill(null);
// 		this.cmap.stored_markers[this.emb].push(this);
// 	}
// };

// function Marker(cmap, used_emb){
// 	let marker;
// 	marker = Object.assign([], Cell_Marker_Proto);
// 	marker.emb = used_emb;
// 	marker.cmap = cmap;
// 	Object.assign(marker, Marker_remover);
// 	return marker;
// }



export default Incidence_Graph;


/// TODO:
/// - FIX FOREACH INTERRUPTION
/// - MODIFY MARKERS TO SET IN INCIDENCE GRAPHE AND CMAPBASE

