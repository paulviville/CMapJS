import IncidenceGraph from '../../CMap/IncidenceGraph.js';
import {Vector3} from '../../Dependencies/three.module.js';
import {importIG, exportIG} from './Ig.js';

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
	return fileStr;
}

function geometryFromIncidenceGraph(iGraph){
	let geometry = {v: [], e: [], f: []};
	const vertex = iGraph.vertex;
	const edge = iGraph.edge;
	const face = iGraph.face;
	console.log(iGraph)
	const position = iGraph.get_attribute(vertex, "position");
	const vids = iGraph.add_attribute(vertex, "id");
	const eids = iGraph.add_attribute(edge, "id");
	const fids = iGraph.add_attribute(face, "id");

	let id = 0;
	iGraph.foreach(vertex, vd => {
		vids[vd] = id++;
		const p = position[iGraph.cell(vertex, vd)];
		geometry.v.push(p.toArray());
	});

	id = 0;
	const verts = [];
	iGraph.foreach(edge, ed => {
		eids[ed] = id++;
		const e = []
		iGraph.foreach_incident(vertex, edge, ed, vd => {
			e.push(vids[vd]);
		});
		geometry.e.push(e);
	});

	iGraph.foreach(face, fd => {
		let f = [];
		iGraph.foreach_incident(edge, face, fd, ed => {
			f.push(eids[ed]);
		});
		geometry.f.push(f);
	});

	iGraph.remove_attribute(vertex, vids);
	iGraph.remove_attribute(edge, eids);
	iGraph.remove_attribute(face, fids);

	return geometry;
}