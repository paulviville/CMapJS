import {cut_all_edges} from '../../../Utils/Subdivision.js';
import {Vector3} from '../../../Dependencies/three.module.js';

export function butterfly(cmap){
	const vertex = cmap.vertex;
	const edge = cmap.edge;
	const face = cmap.face;
	const pos = cmap.getAttribute(vertex, "position");

	let vertex_cache = cmap.cache(vertex);
	let edge_cache = cmap.cache(edge);
	let face_cache = cmap.cache(face);

	let edge_mid_cache = [];
	cut_all_edges(cmap, vd => {
		edge_mid_cache.push(vd);
		pos[cmap.cell(vertex, vd)] = new Vector3;
	});

	let d;
	cmap.foreach(vertex, vd => {
		d = cmap.phi2[vd];
		pos[cmap.cell(vertex, vd)].addScaledVector(pos[cmap.cell(vertex, d)], 0.5);
		d = cmap.phi1[cmap.phi1[d]];
		pos[cmap.cell(vertex, vd)].addScaledVector(pos[cmap.cell(vertex, d)], 0.5);
		d = cmap.phi1[cmap.phi1[d]]
		pos[cmap.cell(vertex, vd)].addScaledVector(pos[cmap.cell(vertex, d)], 2 / 16);
		d = cmap.phi2[cmap.phi1[cmap.phi1[vd]]]
		pos[cmap.cell(vertex, vd)].addScaledVector(pos[cmap.cell(vertex, d)], 2 / 16);
		d = cmap.phi_1[cmap.phi_1[d]]
		pos[cmap.cell(vertex, vd)].addScaledVector(pos[cmap.cell(vertex, d)], -1 / 16);
		d = cmap.phi_1[cmap.phi_1[cmap.phi2[cmap.phi_1[cmap.phi2[vd]]]]]
		pos[cmap.cell(vertex, vd)].addScaledVector(pos[cmap.cell(vertex, d)], -1 / 16);
		d = cmap.phi1[cmap.phi1[cmap.phi1[cmap.phi2[cmap.phi1[cmap.phi1[cmap.phi2[vd]]]]]]]
		pos[cmap.cell(vertex, vd)].addScaledVector(pos[cmap.cell(vertex, d)], -1 / 16);
		d = cmap.phi1[cmap.phi1[cmap.phi1[cmap.phi2[cmap.phi1[cmap.phi1[cmap.phi1[vd]]]]]]]
		pos[cmap.cell(vertex, vd)].addScaledVector(pos[cmap.cell(vertex, d)], -1 / 16);
		
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
};