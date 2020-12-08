import {triangulate_all_faces} from '../../../Utils/Subdivision.js';
import {Vector3} from '../../../Dependencies/three.module.js';

function alpha(n){
	let alph = 4.0;
	alph -= 2.0 * Math.cos(2.0 * Math.PI / n);
	alph /= 9.0;
	return alph;
}

export function sqrt3(cmap){
	const vertex = cmap.vertex;
	const edge = cmap.edge;
	const pos = cmap.get_attribute(vertex, "position");
	const delta = cmap.add_attribute(vertex, "delta");

	let edge_cache = cmap.cache(edge);
	let vertex_cache = cmap.cache(vertex);

	triangulate_all_faces(cmap, vd => {
		let degree = 0;
		let vid = cmap.cell(vertex, vd);
		pos[vid] = new Vector3;
		cmap.foreach_dart_of(vertex, vd, d => {
			++degree;
			pos[vid].add(pos[cmap.cell(vertex, cmap.phi2[d])]);
		});
		pos[vid].multiplyScalar(1 / degree);
	});

	cmap.foreach(edge, ed => {
		cmap.flip_edge(ed);
	}, {cache: edge_cache});

	let vd1, n, vid;
	let sum_Q = new Vector3;
	cmap.foreach(vertex, vd0 => {
		sum_Q.set(0,0,0);
		n = 0;
		vd1 = cmap.phi_1[vd0];
		vid = cmap.cell(vertex, vd1);
		cmap.foreach_dart_of(vertex, vd1, d => {
			sum_Q.add(pos[cmap.cell(vertex, cmap.phi2[cmap.phi1[cmap.phi2[cmap.phi1[d]]]])]);
			++n;
		});
		sum_Q.divideScalar(n);
		let alph = alpha(n);
		delta[vid] = new Vector3;
		delta[vid].addScaledVector(pos[vid], -alph);
		delta[vid].addScaledVector(sum_Q, alph);
	}, {cache: vertex_cache});

	cmap.foreach(vertex, vd0 => {
		vd1 = cmap.phi_1[vd0];
		vid = cmap.cell(vertex, vd1);
		pos[vid].add(delta[vid]);
	}, {cache: vertex_cache});

	delta.delete();
}