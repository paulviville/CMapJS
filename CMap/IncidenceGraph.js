import AttributesContainer from './AttributeContainer.js';

/// Base Structure for CMaps, further extended and specialized later
function IncidenceGraph(){
	/// Attribute containers for all cell types
	const attributeContainers = [];
	// /// Dart topological relations
	// const topology = {};
	/// Cell embeddings
	const embeddings = [];
	/// stored markers
	this.storedMarkers = [];
	// /// Cells
	// const cells = [];

	/// All cell types dart traversor functions
	this.funcsForeach = [];
	/// All cell types incident traversors functions
	this.funcsForeachIncident = [];

	/// Creates a new cell type by adding an attribute container to the map
	this.addCelltype = function(){
		const emb = attributeContainers.length;
		attributeContainers[emb] = new AttributesContainer();
		this.funcsForeachIncident[emb] = [];
		this.storedMarkers[emb] = [];		
		return emb;
	};

	/// Adds an attribute to given embedding
	this.addAttribute = function(emb, name){
		return attributeContainers[emb].createAttribute(name)	
	};

	/// Gets attribute of given embedding and name if it exists
	this.getAttribute = function(emb, name){	
		return attributeContainers[emb].getAttribute(name)	
	};

	/// Deletes given attribute 
	this.removeAttribute = function(emb, attrib){	
		attributeContainers[emb].removeAttribute(attrib.name)	
	};

	/// Creates a new cell of given embedding
	this.newCell = function(emb){	
		let c = attributeContainers[emb].new_element();
		embeddings[emb][c] = c;
		return c;
	};

	/// Counts cells of given type
	this.nbCells = function(emb){
		let i = 0;
		this.foreach(emb, c => {++i}, {use_emb: this.isEmbedded(emb)});
		return i;
	};

	/// Deletes given cell
	this.deleteCell = function(emb, e){	
		attributeContainers[emb].deleteElement(e);
		embeddings[emb][e] = -1;
	};

	/// Adds new embedding for cell
	this.createEmbedding = function(emb){	
		if(!embeddings[emb])	
			embeddings[emb] = this.addAttribute(emb, "<emb_" + emb + ">")	
	};

	/// Verifies cell type embedding
	this.isEmbedded = function(emb){	
		return (embeddings[emb]? true : false);
	};

	/// Gets cell embedding of the cell type - for renderer compatibility
	this.cell = function(emb, c){
		return embeddings[emb][c];
	};

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
	// /// c : target cell
	this.foreachIncident = function(inc_emb, cell_emb, c, func){
		this.funcsForeachIncident[cell_emb][inc_emb](c, func);
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
	this.deleteMap = function(){
		attributeContainers.forEach(ac => ac.delete());
		Object.keys(this).forEach(key => delete this[key]);
	};


	// /// Returns a dart marker or a cell marker of given embedding 
	// this.newMarker = function(used_emb){
	// 	if(this.storedMarkers[used_emb? used_emb : this.dart].length)
	// 		return this.storedMarkers[used_emb? used_emb : this.dart].pop();

	// 	return new Marker(this, used_emb);
	// };

	// // Garbage to fix
	// this.degree = function(emb, cd){
	// 	let deg = 0;
	// 	this.foreachDartOf(emb, cd, d => {
	// 		++deg;
	// 	});
	// 	return deg;
	// };


	this.vertex = this.addCelltype();
	this.createEmbedding(this.vertex);
	const incident_edges_to_vertex = this.addAttribute(this.vertex, "incident_edges"); 
	
	this.edge = this.addCelltype();
	this.createEmbedding(this.edge);
	const incident_vertices_to_edge = this.addAttribute(this.edge, "incident_vertices"); 
	const incident_faces_to_edge = this.addAttribute(this.edge, "incident_faces"); 
	
	this.face = this.addCelltype();
	this.createEmbedding(this.face);
	const incident_edges_to_face = this.addAttribute(this.face, "incident_edges"); 

	this.debug = function(){
		console.log(attributeContainers, embeddings);
		console.log(incident_vertices_to_edge, incident_faces_to_edge,
			incident_edges_to_face, incident_edges_to_vertex);
	};

	this.funcsForeachIncident[this.vertex][this.edge] = function (v, func) {
		incident_edges_to_vertex[v].forEach(e => {func(e);});
	};

	this.funcsForeachIncident[this.vertex][this.face] = function (v, func) {
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

	this.funcsForeachIncident[this.edge][this.vertex] = function (e, func) {
		func(incident_vertices_to_edge[e].v0);			
		func(incident_vertices_to_edge[e].v1);			
	};

	this.funcsForeachIncident[this.edge][this.face] = function (e, func) {
		incident_faces_to_edge[e].forEach(f => {
			func(f);
		});
	};

	this.funcsForeachIncident[this.face][this.vertex] = function (f, func) {
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

	this.funcsForeachIncident[this.face][this.edge] = function (f, func) {
		incident_edges_to_face[f].forEach(e => {func(e)});
	};

	this.addVertex = function () {
		let v = this.newCell(this.vertex);
		incident_edges_to_vertex[v] = new Set;
		return v;
	};

	this.deleteVertex = function (v) {
		this.foreachIncident(this.edge, this.vertex, v, e => {this.deleteEdge(e)});
		this.deleteCell(this.vertex, v);
	};

	this.addEdge = function(v0, v1) {
		let e = this.newCell(this.edge);
		incident_vertices_to_edge[e] = {v0, v1};
		incident_edges_to_vertex[v0].add(e);
		incident_edges_to_vertex[v1].add(e);
		incident_faces_to_edge[e] = new Set;
		return e;
	};
	
	this.deleteEdge = function(e) {
		this.foreachIncident(this.face, this.edge, e, f => {
			this.deleteFace(f);
		});
		this.foreachIncident(this.vertex, this.edge, e, v => {
			incident_edges_to_vertex[v].delete(e);
		});
		this.deleteCell(this.edge, e);
	};

	function sortEdges(sorted, unsorted) {
		sorted.push(unsorted.pop());
		const v0 = incident_vertices_to_edge[sorted[0]].v0;
		let v = incident_vertices_to_edge[sorted[0]].v1;
		let broken = false;
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
			broken = v == v0 || i == end;
			if (broken)
				break;
		}

		return (broken && unsorted.length == 0);
	}

	this.addFace = function(...edges) {
		let sorted = []
		if(edges.length > 2 && sortEdges(sorted, edges)) {
			let f = this.newCell(this.face);
			incident_edges_to_face[f] = sorted;
			sorted.forEach(e => {incident_faces_to_edge[e].add(f);});
			return f;
		}
	};

	this.deleteFace = function(f) {
		this.foreachIncident(this.edge, this.face, f, e => {
			incident_faces_to_edge[e].delete(f);
		});
		this.deleteCell(this.face, f);
	};

	function findCommonVertex(e0 , e1) {
		if((incident_vertices_to_edge[e0].v0 == incident_vertices_to_edge[e1].v0) ||  
			(incident_vertices_to_edge[e0].v0 == incident_vertices_to_edge[e1].v1))
			return incident_vertices_to_edge[e0].v0;
		if((incident_vertices_to_edge[e0].v1 == incident_vertices_to_edge[e1].v0) ||  
			(incident_vertices_to_edge[e0].v1 == incident_vertices_to_edge[e1].v1))
			return incident_vertices_to_edge[e0].v1;
		return -1;
	}

	// sorts a loop of edges
	this.sortedFaceVertices = function (edges) {
		const sortedVertices = [];
		for(let i = 0; i < edges.length; ++i) {
			sortedVertices.push(findCommonVertex(edges[i], edges[(i + 1) % edges.length]));
		}
		sortedVertices.unshift(sortedVertices.pop());
		return sortedVertices;
	}

	this.cutEdge = function(e0) {
		const v1 = this.addVertex();
		const e0vs = incident_vertices_to_edge[e0];
		incident_edges_to_vertex[e0vs.v1].delete(e0);
		const e1 = this.addEdge(v1, e0vs.v1);
		e0vs.v1 = v1;
		incident_edges_to_vertex[v1].add(e0);
		this.foreachIncident(this.face, this.edge, e0, f => {
			incident_faces_to_edge[e1].add(f);
			incident_edges_to_face[f].push(e1);
			let sorted = [];
			sortEdges(sorted, incident_edges_to_face[f]);
			incident_edges_to_face[f] = sorted;
		});
		return v1;
	};

	this.cutFace = function(f, v0, v1) {
		const unsortedEdges = [];
		this.foreachIncident(this.edge, this.face, f, e => {unsortedEdges.push(e)});
		const sortedEdges = [];
		sortEdges(sortedEdges, unsortedEdges);
		const sortedVertices = this.sortedFaceVertices(sortedEdges);
		const first = [];
		const second = [];
		let inside = false;
		for(let i = 0; i < sortedEdges.length; ++i) {
			if(sortedVertices[i] == v0 || sortedVertices[i] == v1) {
				inside = !inside;
				console.log(inside)
			}
			inside ? second.push(sortedEdges[i]) : first.push(sortedEdges[i]);
		}
		let e = this.addEdge(v0, v1);
		first.push(e);
		second.push(e);

		console.log(first, second);

		let str1 = "";
		this.foreach(this.edge, e => {
			str1 +=  "( " + e + ": " + incident_vertices_to_edge[e].v0 + " - " + incident_vertices_to_edge[e].v1 +" )";
		}, {cache: first});

		let str2 = "\n";
		this.foreach(this.edge, e => {
			str2 += "( "  + e + ": "+ incident_vertices_to_edge[e].v0 + " - " + incident_vertices_to_edge[e].v1 +" )";
		}, {cache: second});

		this.deleteFace(f);
		let f0 = this.addFace(...first);
		let f1 = this.addFace(...second);
	};
}

// let CellMarkerProto = {
// 	cmap: undefined, 
// 	emb: undefined,

// 	mark: function(d) {this[this.cmap.cell(this.emb, d)] = true},
// 	unmark: function(d) {this[this.cmap.cell(this.emb, d)] = false},
// 	marked: function(d) {return this[this.cmap.cell(this.emb, d)]},
// };

// let MarkerRemover = {
// 	remove: function(){
// 		this.fill(null);
// 		this.cmap.storedMarkers[this.emb].push(this);
// 	}
// };

// function Marker(cmap, used_emb){
// 	let marker;
// 	marker = Object.assign([], CellMarkerProto);
// 	marker.emb = used_emb;
// 	marker.cmap = cmap;
// 	Object.assign(marker, MarkerRemover);
// 	return marker;
// }



export default IncidenceGraph;


/// TODO:
/// - FIX FOREACH INTERRUPTION
/// - MODIFY MARKERS TO SET IN INCIDENCE GRAPHE AND CMAPBASE

