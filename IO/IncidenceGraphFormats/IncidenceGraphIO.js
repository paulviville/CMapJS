import IncidenceGraph from '../../CMap/IncidenceGraph.js';
import {Vector3} from '../../Dependencies/three.module.js';
import {importIG} from './Ig.js';

export function importIncidenceGraph(format, fileStr){
	let geometry = geometryFromStr(format, fileStr);
	console.log(geometry);
	let iGraph = incidenceGraphFromGeometry(geometry);
	return iGraph;
}

function geometryFromStr(format, fileStr){
	let geometry;
	switch(format){
		case 'ig':
			geometry = importIG(fileStr);
			break;
		default:
			break;
	}
	return geometry;
}

function incidenceGraphFromGeometry(geometry){
	const iGraph = new IncidenceGraph;
	const vertex = iGraph.vertex;
	const edge = iGraph.edge;
	const face = iGraph.face;

	const position = iGraph.add_attribute(vertex, "position");

	const vertices = [];
	geometry.v.forEach(v3 => {
		const vd = iGraph.add_vertex();
		vertices.push(vd);
	 	position[vd] = new Vector3().fromArray(v3);
	});

	const edges = [];
	geometry.e.forEach(e => {
		const ed = iGraph.add_edge(vertices[e[0]], vertices[e[1]]);
		edges.push(ed);
	});

	geometry.f.forEach(f => {
		f = f.map(e => edges[e]);
		const fd = iGraph.add_face(...f);
	});
	return iGraph;
}

export function exportIncidenceGraph(iGraph, format){
	let geometry = geometryFromIncidenceGraph(iGraph);
	console.log(geometry);
	let str = strFromGeometry(format, geometry);
	return str;
}

function strFromGeometry(format, geometry){
	let fileStr;
	switch(format){
		case 'ig':
			fileStr = exportIG(geometry);
			break;
		default:
			break;
	}
	return geometry;
}

// function geometryFromIncidenceGraph(graph){
// 	let geometry = {v: [], e: [], f: []};
// 	const vertex = graph.vertex;
// 	const edge = graph.edge;
// 	const face = graph.face;

// 	const position = graph.get_attribute(vertex, "position");
// 	const vertex_id = graph.add_attribute(vertex, "id");

// 	let id = 0;
// 	graph.foreach(vertex, vd => {
// 		vertex_id[graph.cell(vertex, vd)] = id++;
// 		const p = position[graph.cell(vertex, vd)];
// 		geometry.v.push(p.x, p.y, p.z);
// 	});

// 	// graph.foreach(edge, ed => {
// 	// 	graph.foreach_dart_of(edge, ed, d => {

// 	// 	});
// 	// });

// 	graph.foreach(face, fd => {
// 		let f = [];
// 		graph.foreach_dart_of(face, fd, d => {
// 			f.push(vertex_id[graph.cell(vertex, d)]);
// 		});
// 		geometry.f.push(f);
// 	});

// 	vertex_id.delete();

// 	return geometry;
// }