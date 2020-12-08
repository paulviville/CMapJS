import {cut_all_edges} from '../../../Utils/Subdivision.js';
import {Vector3} from '../../../Dependencies/three.module.js';

function beta(n){
	return n == 3? 3/16 : 3/(8*n);
}

export function loop(cmap){
	const vertex = cmap.vertex;
	const edge = cmap.edge;
	const face = cmap.face;
	const pos = cmap.get_attribute(vertex, "position");
	const new_pos = cmap.add_attribute(vertex, "new_pos");

	let face_cache = cmap.cache(face);

	cmap.foreach(vertex, vd => {
		let degree = 0;
		let vid = cmap.cell(vertex, vd);
		new_pos[vid] = new Vector3;
		cmap.foreach_dart_of(vertex, vd, d => {
			++degree;
			new_pos[vid].add(pos[cmap.cell(vertex, cmap.phi2[d])]);
		});
		let b = beta(degree);
		new_pos[vid].multiplyScalar(b);
		new_pos[vid].addScaledVector(pos[cmap.cell(vertex, vd)], 1 - degree *b);
	});

	let edge_mid_cache = [];
	cut_all_edges(cmap, vd => {
		edge_mid_cache.push(vd);
		new_pos[cmap.cell(vertex, vd)] = new Vector3;
	});

	let d;
	cmap.foreach(vertex, vd => {
		d = cmap.phi1[vd];
		new_pos[cmap.cell(vertex, vd)].addScaledVector(pos[cmap.cell(vertex, d)], 3)
		d = cmap.phi1[cmap.phi1[d]];
		new_pos[cmap.cell(vertex, vd)].add(pos[cmap.cell(vertex, d)])
		d = cmap.phi1[cmap.phi2[cmap.phi_1[vd]]];
		new_pos[cmap.cell(vertex, vd)].addScaledVector(pos[cmap.cell(vertex, d)], 3)
		d = cmap.phi1[cmap.phi1[d]];
		new_pos[cmap.cell(vertex, vd)].add(pos[cmap.cell(vertex, d)])
		new_pos[cmap.cell(vertex, vd)].divideScalar(8);
	}, {cache: edge_mid_cache});

	let d0, d1;
	cmap.foreach(face, fd => {
		d0 = cmap.phi1[fd];
		d1 = cmap.phi1[cmap.phi1[d0]];
		cmap.cut_face(d0, d1);

		d0 = d1;
		d1 = cmap.phi1[cmap.phi1[d0]];
		cmap.cut_face(d0, d1);
		
		d0 = d1;
		d1 = cmap.phi1[cmap.phi1[d0]];
		cmap.cut_face(d0, d1);
	}, {cache: face_cache});

	cmap.foreach(vertex, vd => {
		pos[cmap.cell(vertex, vd)] = new_pos[cmap.cell(vertex, vd)];
	});
	new_pos.delete();
};