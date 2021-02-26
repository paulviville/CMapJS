import {cut_all_edges, quadrangulate_all_faces, quadrangulate_face} from '../../../Utils/Subdivision.js';
import {TetrahedronGeometry, Vector3} from '../../../Dependencies/three.module.js';

export function catmull_clark(cmap){
	const vertex = cmap.vertex;
	const edge = cmap.edge;
	const face = cmap.face;

	const pos = cmap.get_attribute(vertex, "position");
	const delta = cmap.add_attribute(vertex, "delta");
	const incident_f = cmap.add_attribute(vertex, "incident_f");

	const init_vertices_cache = cmap.cache(vertex);
	const face_vertices_cache = [];
	const edge_vertices_cache = [];

	quadrangulate_all_faces(cmap, 
		vd => {
			edge_vertices_cache.push(vd);

			let vid = cmap.cell(vertex, vd);
			pos[vid] = new Vector3;
			delta[vid] = new Vector3;
			incident_f[vid] = new Vector3;
			cmap.foreach_dart_of(vertex, vd, d => {
				pos[vid].add(pos[cmap.cell(vertex, cmap.phi2[d])]);
				delta[vid].sub(pos[cmap.cell(vertex, cmap.phi2[d])]);
			})
			pos[vid].multiplyScalar(0.5);
			delta[vid].multiplyScalar(0.25);
		},
		vd => {
			face_vertices_cache.push(vd);
			let vid = cmap.cell(vertex, vd);
			let nb_edges = 0;
			pos[vid] = new Vector3;
			delta[vid] = new Vector3;
			cmap.foreach_dart_of(vertex, vd, d => {
				pos[vid].add(pos[cmap.cell(vertex, cmap.phi2[d])]);
				++nb_edges;
			});
			pos[vid].multiplyScalar(1 / nb_edges);

			cmap.foreach_dart_of(vertex, vd, d => {
				delta[cmap.cell(vertex, cmap.phi2[d])].addScaledVector(pos[vid], 0.25);
				incident_f[cmap.cell(vertex, cmap.phi2[d])].addScaledVector(pos[vid], 0.5);
			});
		});
	
	let F = new Vector3;
	let R = new Vector3;
	let n = 0;
	let vid2 = 0;
	cmap.foreach(vertex, vd => {
		delta[cmap.cell(vertex, vd)] = new Vector3;
		F.set(0, 0, 0);
		R.set(0, 0, 0);
		n = 0;
		cmap.foreach_dart_of(vertex, vd, d => {
			vid2 = cmap.cell(vertex, cmap.phi2[d]);
			F.add(incident_f[vid2]);
			R.add(pos[vid2]);
			++n;
		});
		delta[cmap.cell(vertex, vd)]
			.addScaledVector(pos[cmap.cell(vertex, vd)], -3 * n)
			.add(F)
			.addScaledVector(R, 2)
			.multiplyScalar(1/(n*n));

	}, {cache: init_vertices_cache});

	cmap.foreach(vertex, vd => {
		pos[cmap.cell(vertex, vd)].add(delta[cmap.cell(vertex, vd)]);
	});

	delta.delete();
	incident_f.delete();
}

// export function catmull_clark_inter(cmap){
// 	const vertex = cmap.vertex;
// 	const edge = cmap.edge;
// 	const face = cmap.face;

// 	const pos = cmap.get_attribute(vertex, "position");
// 	const delta = cmap.add_attribute(vertex, "delta");
// 	const incident_f = cmap.add_attribute(vertex, "incident_f");

// 	const init_vertices_cache = cmap.cache(vertex);
// 	const face_vertices_cache = [];
// 	const edge_vertices_cache = [];

// 	quadrangulate_all_faces(cmap, 
// 		vd => {
// 			edge_vertices_cache.push(vd);

// 			let vid = cmap.cell(vertex, vd);
// 			pos[vid] = new Vector3();
// 			delta[vid] = new Vector3();
// 			incident_f[vid] = new Vector3();
// 			cmap.foreach_dart_of(vertex, vd, d => {
// 				pos[vid].add(pos[cmap.cell(vertex, cmap.phi2[d])]);
// 				delta[vid].sub(pos[cmap.cell(vertex, cmap.phi2[d])]);
// 			})
// 			pos[vid].multiplyScalar(0.5);
// 			delta[vid].multiplyScalar(0.25);
// 		},
// 		vd => {
// 			face_vertices_cache.push(vd);
// 			let vid = cmap.cell(vertex, vd);
// 			let nb_edges = 0;
// 			pos[vid] = new Vector3();
// 			delta[vid] = new Vector3();
// 			cmap.foreach_dart_of(vertex, vd, d => {
// 				pos[vid].add(pos[cmap.cell(vertex, cmap.phi2[d])]);
// 				++nb_edges;
// 			});
// 			pos[vid].multiplyScalar(1 / nb_edges);

// 			cmap.foreach_dart_of(vertex, vd, d => {
// 				delta[cmap.cell(vertex, cmap.phi2[d])].addScaledVector(pos[vid], 0.25);
// 				incident_f[cmap.cell(vertex, cmap.phi2[d])].addScaledVector(pos[vid], 0.5);
// 			});
// 		});
	
// 	let F = new Vector3;
// 	let R = new Vector3;
// 	let n = 0;
// 	let vid2 = 0;
// 	cmap.foreach(vertex, vd => {
// 		delta[cmap.cell(vertex, vd)] = new Vector3();
// 		F.set(0, 0, 0);
// 		R.set(0, 0, 0);
// 		n = 0;
// 		cmap.foreach_dart_of(vertex, vd, d => {
// 			vid2 = cmap.cell(vertex, cmap.phi2[d]);
// 			F.add(incident_f[vid2]);
// 			R.add(pos[vid2]);
// 			++n;
// 		});
// 		delta[cmap.cell(vertex, vd)]
// 			.addScaledVector(pos[cmap.cell(vertex, vd)], -3 * n)
// 			.add(F)
// 			.addScaledVector(R, 2)
// 			.multiplyScalar(1/(n*n));

// 	}, {cache: init_vertices_cache});

// 	cmap.foreach(vertex, vd => {
// 		let avg_delta = new Vector3;
// 		let n = 0;
// 		cmap.foreach_dart_of(vertex, vd, d => {
// 			avg_delta.add(delta[cmap.cell(vertex, cmap.phi1[cmap.phi1[d]])]);
// 			++n;
// 		});
// 		avg_delta.divideScalar(n);
// 		console.log(avg_delta)
// 		pos[cmap.cell(vertex, vd)].sub(avg_delta);
// 	}, {cache: face_vertices_cache});

// 	cmap.foreach(vertex, vd => {
// 		let avg_delta = new Vector3;
// 		let n = 0;
// 		cmap.foreach_dart_of(vertex, vd, d => {
// 			avg_delta.add(delta[cmap.cell(vertex, cmap.phi1[cmap.phi1[d]])]);
// 			++n;
// 		});
// 		avg_delta.divideScalar(n);
// 		pos[cmap.cell(vertex, vd)].sub(avg_delta);
// 	}, {cache: edge_vertices_cache});

// 	delta.delete();
// 	incident_f.delete();
// }

export function catmull_clark_inter(cmap){
	const vertex = cmap.vertex;
	const edge = cmap.edge;
	const face = cmap.face;

	const pos = cmap.get_attribute(vertex, "position");
	const pos2 = cmap.add_attribute(vertex, "position2");
	const delta = cmap.add_attribute(vertex, "delta");

	const init_vertices_cache = cmap.cache(vertex);
	const init_edges_cache = cmap.cache(edge);
	const face_vertices_cache = [];
	const edge_vertices_cache = [];

	quadrangulate_all_faces(cmap, 
		vd => {
			edge_vertices_cache.push(vd);

			let vid = cmap.cell(vertex, vd);
			pos[vid] = new Vector3();
			cmap.foreach_dart_of(vertex, vd, d => {
				pos[vid].add(pos[cmap.cell(vertex, cmap.phi2[d])]);
			});
			pos[vid].multiplyScalar(0.5);
		},
		vd => {
			face_vertices_cache.push(vd);
			let vid = cmap.cell(vertex, vd);
			let nb_edges = 0;
			pos[vid] = new Vector3();
			cmap.foreach_dart_of(vertex, vd, d => {
				pos[vid].add(pos[cmap.cell(vertex, cmap.phi2[d])]);
				++nb_edges;
			});
			pos[vid].multiplyScalar(1 / nb_edges);
		});
	
	cmap.foreach(vertex, vd => {
		let nb_f = 0;
		const p2 = new Vector3;
		cmap.foreach_dart_of(vertex, vd, d => {
			p2.add(pos[cmap.cell(vertex, cmap.phi1[cmap.phi1[d]])]);
			++nb_f;
		});
		pos2[cmap.cell(vertex, vd)] = p2.divideScalar(nb_f);
	}, {cache: init_vertices_cache});

	cmap.foreach(vertex, vd => {
		// let vd = cmap.phi1[ed];
		const p2 = new Vector3;
		const del = new Vector3;
		let d = cmap.phi2[vd];
		del.sub(pos2[cmap.cell(vertex, d)]);
		d = cmap.phi2[cmap.phi1[d]];
		del.add(pos[cmap.cell(vertex, d)]);
		p2.add(pos[cmap.cell(vertex, d)]);
		d = cmap.phi2[cmap.phi1[d]];
		del.sub(pos2[cmap.cell(vertex, d)]);
		d = cmap.phi2[cmap.phi1[d]];
		del.add(pos[cmap.cell(vertex, d)]);
		p2.add(pos[cmap.cell(vertex, d)]);

		pos2[cmap.cell(vertex, vd)] = p2.divideScalar(2);
		delta[cmap.cell(vertex, vd)] = del.divideScalar(4);
	}, {cache: edge_vertices_cache});

	cmap.foreach(vertex, vd => {
		const sum = new Vector3;
		const del = new Vector3;
		let degree = 0;
		cmap.foreach_dart_of(vertex, vd, d => {
			++degree;
			sum.addScaledVector(pos2[cmap.cell(vertex, cmap.phi1[d])], 2);
			sum.add(pos2[cmap.cell(vertex, cmap.phi1[cmap.phi1[d]])]);
		});
		del.copy(pos[cmap.cell(vertex, vd)]);
		del.multiplyScalar(-3 * degree);
		del.add(sum);
		del.divideScalar(degree * degree);
		delta[cmap.cell(vertex, vd)] = del;
	}, {cache: face_vertices_cache});


	cmap.foreach(vertex, vd => {
		pos[cmap.cell(vertex, vd)].add(delta[cmap.cell(vertex, vd)]);
	}, {cache: edge_vertices_cache});

	cmap.foreach(vertex, vd => {
		pos[cmap.cell(vertex, vd)].sub(delta[cmap.cell(vertex, vd)]);
	}, {cache: face_vertices_cache});

	pos2.delete();
	delta.delete();
}