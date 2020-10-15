import {CMap3, CMap2} from '../../CMap/CMap.js';
import {Vector3} from '../../three.module.js';
import {load_mesh, export_mesh} from './Mesh.js';

export function load_cmap3(format, file_str){
	let geometry = geometry_from_str(format, file_str);
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
	const vertex = map.vertex;
	const vertex2 = map.vertex2;
	const face2 = map.face2;

	let position = map.add_attribute(vertex, "position");
	let dart_per_vertex = map.add_attribute(vertex, "dart_per_vertex");

	let vertex_ids = [];
	geometry.v.forEach(vert => {
		let i = map.new_cell(vertex);
		vertex_ids.push(i);
		dart_per_vertex[i] = [];
		position[i] = new Vector3(vert[0], vert[1], vert[2]);
	})

	map.create_embedding(vertex);

	if(geometry.tet)
		geometry.tet.forEach(tet => {

		});

	if(geometry.hex)
		geometry.hex.forEach(hex => {
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
				map.foreach_dart_of(vertex2, darts_of_hex[i], vd2 => {
					map.set_embedding(map.vertex, vd2, hex[i]);
					dart_per_vertex[hex[i]].push(vd2);
				});
			}
		});

	if(geometry.vol)
		geometry.vol.forEach(vol => {

		});
	
	let marker = map.new_marker();
	let open_map = false;
	map.foreach_dart(d0 => {
		if(map.phi3[d0] == d0 && !marker.marked(d0)){
			map.foreach_dart_of(map.face2, d0, d1 => {
				marker.mark(d1)
			});

			let target_d;
			let d1 = d0;
			do {
				let vid0 = map.cell(vertex, d1);
				let vid1 = map.cell(vertex, map.phi1[map.phi1[d1]]);
				let v_darts = dart_per_vertex[map.cell(vertex, map.phi1[d1])];
				v_darts.forEach(d => {
					if(map.cell(vertex, map.phi1[d]) == vid0 && map.cell(vertex, map.phi_1[d]) == vid1){
						target_d = d;
						// return true;
					}
				});
				d1 = map.phi1[d1];
			} while(target_d == undefined && d1 != d0);

			if(target_d != undefined){
				d1 = map.phi_1[d1];
				let d2 = target_d;
				do {
					d1 = map.phi1[d1];
					d2 = map.phi_1[d2];
					map.sew_phi3(d1, d2);
				} while(d1 != d0);

			}
			open_map |= target_d != undefined;
		}
	});
	marker.remove();
	
	if(open_map)
		map.close(true);

	dart_per_vertex.delete();

	return map;
}