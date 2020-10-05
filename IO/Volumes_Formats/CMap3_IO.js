import {CMap3} from '../../CMap/CMap.js';
import {Vector3} from '../../three.module.js';
import {load_mesh, export_mesh} from './Mesh.js';

export function load_cmap3(format, file_str){
	let geometry = geometry_from_str(format, file_str);
	console.log(geometry);
	let map = map_from_geometry(geometry);
	return map;
}

function geometry_from_str(format, file_str){
	let geometry;
	switch(format){
		case 'mesh':
			geometry = load_mesh(file_str);
			break;
		default:
			break;
	}
	return geometry;
}

function map_from_geometry(geometry){
	let map = new CMap3;
	let position = map.add_attribute(map.vertex, "position");
	let dart_per_vertex = map.add_attribute(map.vertex, "dart_per_vertex");

	let vertex_ids = [];
	geometry.v.forEach(vertex => {
		let i = map.new_cell(map.vertex);
		vertex_ids.push(i);
		dart_per_vertex[i] = [];
		position[i] = new Vector3(vertex[0], vertex[1], vertex[2]);
	})

	map.set_embeddings(map.vertex);

	geometry.hex.forEach(hex => {
		// let d = map.add_face(face.length, false);
		let d0 = map.add_prism(4, false);
		let d1 = map.phi2[map.phi1[map.phi1[map.phi2[d0]]]];
		let darts_of_hex = [
			d0,
			map.phi_1[d0],
			map.phi1[map.phi1[d0]],
			map.phi1[d0],
			map.phi1[d1],
			map.phi1[map.phi1[d1]],
			map.phi_1[d1],
			d1
		];


		for(let i = 0; i < hex.length; ++i){
			map.set_embedding(map.vertex, darts_of_hex[i], hex[i]);
			dart_per_vertex[hex[i]].push(darts_of_hex[i]);
		}
	});
	console.log(dart_per_vertex);



	map.close(true);
	// dart_per_vertex.delete();

	return map;
}