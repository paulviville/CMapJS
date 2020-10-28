import {Vector3} from '../../../three.module.js';

export function doo_sabin(cmap){
	const vertex = cmap.vertex;
	const edge = cmap.edge;
	const face = cmap.face;

	const pos = cmap.get_attribute(vertex, "position");
	const delta = cmap.add_attribute(vertex, "delta");


	let vertex_marker = cmap.new_fast_marker();
	let edge_marker = cmap.new_fast_marker();
	let edge_cache = cmap.cache(edge);
	let face_cache = cmap.cache(face);
	let holes = [];
	let corners = [];

	/// marking one to keep index
	cmap.foreach(vertex, vd => {
		vertex_marker.mark(vd);
	}, {use_emb: true});

	let ed1, efd;
	cmap.foreach(edge, ed0 => {
		edge_marker.mark(ed0);
		ed1 = cmap.phi2[ed0];
		cmap.unsew_phi2(ed0);
		efd = cmap.add_face(4, false);
		cmap.sew_phi2(ed0, efd);
		cmap.sew_phi2(ed1, cmap.phi1[cmap.phi1[efd]]);
		holes.push(cmap.phi1[efd]);
		holes.push(cmap.phi_1[efd]);

	}, {cache: edge_cache});

	for(let i = 0; i < holes.length; ++i){
		if(holes[i] != cmap.phi2[holes[i]])
			continue; 

		cmap.close_hole(holes[i], false, false);
	}	

	let point;
	let vid;
	cmap.foreach(face, fd => {
		cmap.foreach_dart_of(face, fd, vd => {
			vid = cmap.cell(vertex, vd);
			if(!vertex_marker.marked(vd)){
				point = pos[vid].clone();
				vid = cmap.new_cell(vertex);
				cmap.set_embedding(vertex, vd, vid);
				pos[vid] = point;
			}
			cmap.foreach_dart_of(vertex, vd, d => {
				cmap.set_embedding(vertex, d, vid);
			});
		});
	}, {cache: face_cache});

	let barycenter = new Vector3;
	let nb_vertices;
	cmap.foreach(face, fd => {
		barycenter.set(0, 0, 0);
		nb_vertices = 0;
		cmap.foreach_dart_of(face, fd, d => {
			++nb_vertices;
			barycenter.add(pos[cmap.cell(vertex, d)])
			delta[cmap.cell(vertex, d)] = pos[cmap.cell(vertex, d)]
				.clone()
				.multiplyScalar(-2)
				.addScaledVector(pos[cmap.cell(vertex, cmap.phi1[d])], 0.5)
				.addScaledVector(pos[cmap.cell(vertex, cmap.phi_1[d])], 0.5);
		});
		barycenter.divideScalar(nb_vertices);

		cmap.foreach_dart_of(face, fd, d => {
			delta[cmap.cell(vertex, d)].add(barycenter).divideScalar(4)
			pos[cmap.cell(vertex, d)].add(delta[cmap.cell(vertex, d)]);
		});


	}, {cache: face_cache});

	
}