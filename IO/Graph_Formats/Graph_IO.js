import {Graph} from '../../CMap/CMap.js';
import {Vector3} from '../../three.module.js';
import {load_cg, save_cg} from './Cg.js';

export function load_graph(format, file_str){
	let geometry = geometry_from_str(format, file_str);
	let graph = graph_from_geometry(geometry);
	return graph;
}

function geometry_from_str(format, file_str){
	let geometry;
	switch(format){
		case 'cg':
			geometry = load_cg(file_str);
			break;
		default:
			break;
	}
	return geometry;
}

function graph_from_geometry(geometry){
	let graph = new Graph;
	const vertex = graph.vertex;

	graph.create_embedding(vertex);
	const position = graph.add_attribute(vertex, "position");

	const vertex_ids = [];
	geometry.v.forEach(v3 => {
		let vd = graph.add_vertex(true);
		vertex_ids.push(vd);
		position[graph.cell(vertex, vd)] = new Vector3(v3[0], v3[1], v3[2]);
	});

	geometry.e.forEach(e => {
		graph.connect_vertices(vertex_ids[e[0]], vertex_ids[e[1]]);
	});

	return graph;
}

export function export_graph(graph, format){
	let geometry = geometry_from_graph(graph);
	console.log(geometry);
	let str = str_from_geometry(format, geometry);
	return str;
}

function str_from_geometry(format, geometry){
	let file_str;
	switch(format){
		case 'off':
			file_str = export_off(geometry);
			break;
		default:
			break;
	}
	return geometry;
}

function geometry_from_graph(graph){
	let geometry = {v: [], e: [], f: []};
	const vertex = graph.vertex;
	const edge = graph.edge;
	const face = graph.face;

	const position = graph.get_attribute(vertex, "position");
	const vertex_id = graph.add_attribute(vertex, "id");

	let id = 0;
	graph.foreach(vertex, vd => {
		vertex_id[graph.cell(vertex, vd)] = id++;
		const p = position[graph.cell(vertex, vd)];
		geometry.v.push(p.x, p.y, p.z);
	});

	// graph.foreach(edge, ed => {
	// 	graph.foreach_dart_of(edge, ed, d => {

	// 	});
	// });

	graph.foreach(face, fd => {
		let f = [];
		graph.foreach_dart_of(face, fd, d => {
			f.push(vertex_id[graph.cell(vertex, d)]);
		});
		geometry.f.push(f);
	});

	vertex_id.delete();

	return geometry;
}