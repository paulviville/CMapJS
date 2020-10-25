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

	/// All cell types embedding functions
	this.funcs_set_embeddings = [];
	/// All cell types traversor functions
	this.funcs_foreach = [];
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
		this.foreach(emb, c => {++i});
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
		return (embeddings[emb]);
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

		this.funcs_set_embeddings[emb].call(this);
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
	this.foreach = function(emb, func, cache){
		this.funcs_foreach[emb].call(this, func, cache);
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
		let marker = this.new_marker(use_embeddings ? inc_emb : undefined);
		this.foreach_dart_of(cell_emb, cd, d0 => {
			if(!marker.marked(d0)){
				if(use_embeddings)
					marker.mark(d0);
				else
					marker.mark_cell(inc_emb, d0);

				return func(d0);
			}
		});
		marker.remove();
	};

	/// Stores all cells of given type in an array
	this.cache = function(emb, cond){
		let cache = [];

		if(!cond)
			this.foreach(emb, cd => { cache.push(cd) });
		else
			this.foreach(emb, cd => { if(cond(cd)) cache.push(cd) });
			
		return cache;
	};

	/// Clears all data
	this.delete_map = function(){
		attributes_containers.forEach(ac => ac.delete());
		Object.keys(this).forEach(key => delete this[key]);
	};

	/// Closes topology into manifold
	this.close = function(){}

	this.dart = this.add_celltype();
	this.funcs_set_embeddings[this.dart] = function(){
		this.foreach_dart(d => {
			this.set_embedding(this.dart, d, d);
		});
	};

	this.funcs_foreach[this.dart] = function(func, cache){
		if(cache){
			cache.some(d => func(d));
			return;
		}

		this.foreach_dart(func);
	};

	this.funcs_foreach_dart_of[this.dart] = function(d, func) {
		func(d);
	};
	

	this.d = this.add_topology_relation("d");

	/// Returns a dart marker or a cell marker of given embedding 
	this.new_marker = function(used_emb = this.dart){
		if(this.stored_markers[used_emb].length)
			return this.stored_markers[used_emb].pop();

		const cmap = this;
		

		return new Marker(this, used_emb);
	};

	this.new_fast_marker = function(used_emb = this.dart){
		return new FastMarker(this, used_emb);
	};

	let boundary_marker = this.new_marker();
	this.mark_as_boundary = function(d){
		boundary_marker.mark(d);
	};

	this.unmark_as_boundary = function(d){
		boundary_marker.unmark(d);
	};

	this.mark_cell_as_boundary = function(emb, cd){
		boundary_marker.mark_cell(emb, cd)
	};

	this.unmark_cell_as_boundary = function(emb, cd){
		boundary_marker.unmark_cell(emb, cd);
	};

	this.is_boundary = function(d){
		return boundary_marker.marked(d);
	};

	this.is_boundary_cell = function(emb, cd){
		return boundary_marker.marked_cell(emb, cd);
	};

	// Garbage to fix
	this.degree = function(emb, cd){
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

function Marker(cmap, used_emb){
	let marker = cmap.add_attribute(used_emb || cmap.dart, "<marker>");
	if(used_emb != cmap.dart){
		marker.mark = function(d) {this[cmap.cell(used_emb, d)] = true};
		marker.unmark = function(d) {this[cmap.cell(used_emb, d)] = false};
		marker.marked = function(d) {return this[cmap.cell(used_emb, d)]};
	}
	else {
		marker.mark = function(d) {this[d] = true};
		marker.unmark = function(d) {this[d] = false};
		marker.marked = function(d) {return this[d]};
		marker.mark_cell = function(emb, cd) {cmap.foreach_dart_of(emb, cd, d => marker.mark(d))};
		marker.unmark_cell = function(emb, cd) {cmap.foreach_dart_of(emb, cd, d => marker.unmark(d))};
		marker.marked_cell = function(emb, cd) {
			let marked = true;
			cmap.foreach_dart_of(emb, cd, d => { 
				marked &= marker.marked(d);
			});
			return marked;
		}
	}
	marker.remove = function(){
		marker.fill(null);
		cmap.stored_markers[used_emb].push(marker);
	}

	return marker;
}

function FastMarker(cmap, used_emb){
	let marker = {};
	if(used_emb != cmap.dart){
		marker.mark = function(d) {this[cmap.cell(used_emb, d)] = true};
		marker.unmark = function(d) {this[cmap.cell(used_emb, d)] = false};
		marker.marked = function(d) {return this[cmap.cell(used_emb, d)]};
	}
	else {
		marker.mark = function(d) {this[d] = true};
		marker.unmark = function(d) {this[d] = false};
		marker.marked = function(d) {return this[d]};
		marker.mark_cell = function(emb, cd) {cmap.foreach_dart_of(emb, cd, d => marker.mark(d))};
		marker.unmark_cell = function(emb, cd) {cmap.foreach_dart_of(emb, cd, d => marker.unmark(d))};
		marker.marked_cell = function(emb, cd) {
			let marked = true;
			cmap.foreach_dart_of(emb, cd, d => { 
				marked &= marker.marked(d);
			});
			return marked;
		}
	}
	// marker.remove = function(){
	// 	marker.fill(null);
	// 	cmap.stored_markers[used_emb].push(marker);
	// }

	return marker;
}



export default CMap_Base;