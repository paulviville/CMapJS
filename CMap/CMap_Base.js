import Attributes_Container from './Attribute_Container.js';

/// Base Structure for CMaps, further extended and specialized later
function CMap_Base(){

	/// Attribute containers for all cell types
	const attributes_containers = [];
	/// Dart topological relations
	const topology = {};
	/// Dart cell embeddings
	const embeddings = [];
	/// stored markers
	this.stored_markers = [];
	this.stored_fast_markers = [];

	/// All cell types dart traversor functions
	this.funcs_foreach_dart_of = [];
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
	
	/// Adds a topological relation to darts
	this.add_topology_relation = function(name){
		topology[name] = this.add_attribute(this.dart, "<topo_" + name + ">");
		return topology[name];
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
		return attributes_containers[emb].new_element();	
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
		if(embeddings[emb])
			embeddings[emb][e] = null;	
	};

	/// Adds new embedding for darts
	this.create_embedding = function(emb){	
		if(!embeddings[emb])	
			embeddings[emb] = this.add_attribute(this.dart, "<emb_" + emb + ">")	
	};

	/// Verifies cell type invading
	this.is_embedded = function(emb){	
		return (embeddings[emb]? true : false);
	};

	/// Gets dart embedding of the cell type
	this.cell = function(emb, d){
		return embeddings[emb][d];
	};

	/// Sets given embedding to given dart
	this.set_embedding = function(emb, d, i){
		attributes_containers[emb].ref(i);
		attributes_containers[emb].unref(embeddings[emb][d]);	
		return embeddings[emb][d] = i;
	};

	/// Sets all dart embeddings for a given cell type
	this.set_embeddings = function(emb){
		if(!this.is_embedded(emb))
			this.create_embedding(emb);

		this.foreach(emb, cd => {
			let cid = this.new_cell(emb);
			this.foreach_dart_of(emb, cd, d => {this.set_embedding(emb, d, cid)});
		});
	};

	/// Creates a new dart in the map
	this.new_dart = function(){
		let new_id = this.new_cell(this.dart);
		attributes_containers[this.dart].ref(new_id);
		Object.values(topology).forEach(relation => relation[new_id] = new_id);
		return new_id;
	};

	/// Deletes given dart
	this.delete_dart = function(d){
		for(let emb = 0; emb < attributes_containers.length; ++emb)
			if(this.is_embedded(emb)){
				attributes_containers[emb].unref(embeddings[emb][d]);
				embeddings[emb][d] = null;
			}
		topology.d[d] = -1;
		attributes_containers[this.dart].delete_element(d);
	};

	/// Traverses all darts in the map
	this.foreach_dart = function(func){
		topology.d.some( d => (d != -1) ? func(d) : undefined );
	};

	/// Counts darts in the map
	this.nb_darts = function(){
		return attributes_containers[this.dart].nb_elements();
	};
	
	/// Traverses and applies func to all cells (of map or cache) of given celltype
	this.foreach = function(emb, func, {cache, use_emb} =  {cache: undefined, use_emb: undefined}){
		// if(use_emb == undefined) use_emb = this.is_embedded(emb);

		if(cache){
			cache.forEach(cd => func(cd));
			return;
		}

		let marker = this.new_fast_marker(use_emb? emb : undefined);
		if(use_emb)
			this.foreach_dart(d => {
				if(marker.marked(d))
					return;

				marker.mark(d);
				return func(d);
			});
		else
			this.foreach_dart(d => {
				if(marker.marked(d))
					return;

				marker.mark_cell(emb, d);
				return func(d);
			});	
	};

	/// Traverses and applies func to all darts of a cell 
	this.foreach_dart_of = function(emb, cell, func){
		this.funcs_foreach_dart_of[emb].call(this, cell, func);
	};

	/// Traverses incident cells of  given type
	/// inc_emb : incident cell type
	/// cell_emb : targete cell type
	/// cd : target cell
	/// Use_embedding switches to cell marker instead of darts
	this.foreach_incident = function(inc_emb, cell_emb, cd, func, use_embeddings = false){
		let marker = this.new_fast_marker(use_embeddings ? inc_emb : undefined);
		if(use_embeddings)
			this.foreach_dart_of(cell_emb, cd, d0 => {
				if(!marker.marked(d0)){
					marker.mark(d0);
					return func(d0);
				}
			});
		else
			this.foreach_dart_of(cell_emb, cd, d0 => {
				if(!marker.marked(d0)){
					marker.mark_cell(inc_emb, d0);
					return func(d0);
				}
			});
	};

	/// Stores all cells of given type in an array
	this.cache = function(emb, cond){
		let cache = [];

		if(!cond)
			this.foreach(emb, cd => { cache.push(cd) },  {use_emb: this.is_embedded(emb)});
		else
			this.foreach(emb, cd => { if(cond(cd)) cache.push(cd) },  {use_emb: this.is_embedded(emb)});
			
		return cache;
	};

	/// Clears all data
	this.delete_map = function(){
		attributes_containers.forEach(ac => ac.delete());
		Object.keys(this).forEach(key => delete this[key]);
	};

	/// Closes topology into manifold
	this.close = function() {}

	this.dart = this.add_celltype();

	this.funcs_foreach_dart_of[this.dart] = function(d, func) {func(d);};

	this.d = this.add_topology_relation("d");

	/// Returns a dart marker or a cell marker of given embedding 
	this.new_marker = function(used_emb) {
		if(this.stored_markers[used_emb? used_emb : this.dart].length)
			return this.stored_markers[used_emb? used_emb : this.dart].pop();

		return new Marker(this, used_emb);
	};

	this.new_fast_marker = function(used_emb) {
		return new FastMarker(this, used_emb);
	};

	let boundary_marker = this.new_marker();
	this.mark_as_boundary = function(d) {
		boundary_marker.mark(d);
	};

	this.unmark_as_boundary = function(d) {
		boundary_marker.unmark(d);
	};

	this.mark_cell_as_boundary = function(emb, cd) {
		boundary_marker.mark_cell(emb, cd)
	};

	this.unmark_cell_as_boundary = function(emb, cd) {
		boundary_marker.unmark_cell(emb, cd);
	};

	this.is_boundary = function(d) {
		return boundary_marker.marked(d);
	};

	this.is_boundary_cell = function(emb, cd) {
		return boundary_marker.marked_cell(emb, cd);
	};

	// Garbage to fix
	this.degree = function(emb, cd) {
		let deg = 0;
		this.foreach_dart_of(emb, cd, d => {
			++deg;
		});
		return deg;
	};

	this.debug = function(){
		console.log(attributes_containers, topology, embeddings);
	}
}

let Dart_Marker_Proto = {
	cmap: undefined,

	mark: function(d) {	this[d] = true;	},
	unmark: function(d) { this[d] = true; },
	marked: function(d) { return this[d]},
	mark_cell: function(emb, cd) {this.cmap.foreach_dart_of(emb, cd, d => this.mark(d))},
	unmark_cell: function(emb, cd) {this.cmap.foreach_dart_of(emb, cd, d => this.unmark(d))},
	marked_cell: function(emb, cd) {
		let marked = true;
		this.cmap.foreach_dart_of(emb, cd, d => { 
			marked &= this.marked(d);
		});
		return marked;
	},
};

let Cell_Marker_Proto = {
	cmap: undefined, 
	emb: undefined,

	mark: function(d) {this[this.cmap.cell(this.emb, d)] = true},
	unmark: function(d) {this[this.cmap.cell(this.emb, d)] = false},
	marked: function(d) {return this[this.cmap.cell(this.emb, d)]},
};
/// Change for set -> mark == add, unmark == delete, marked == has

let Marker_remover = {
	remove: function(){
		this.fill(null);
		this.cmap.stored_markers[this.emb || this.cmap.dart].push(this);
	}
};

function Marker(cmap, used_emb) {
	let marker;
	if(used_emb){
		marker = Object.assign([], Cell_Marker_Proto);
		marker.emb = used_emb;
	}
	else
		marker = Object.assign([], Dart_Marker_Proto);
	marker.cmap = cmap;
	Object.assign(marker, Marker_remover);
	return marker;
}

function FastMarker(cmap, used_emb){
	let marker;
	if(used_emb){
		marker = Object.assign([], Cell_Marker_Proto);
		marker.emb = used_emb;
	}
	else
		marker = Object.assign([], Dart_Marker_Proto);
	marker.cmap = cmap;

	return marker;
}



export default CMap_Base;