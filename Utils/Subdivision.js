export function cut_all_edges(cmap, func){
	let edge_cache = cmap.cache(cmap.edge);

	cmap.foreach(cmap.edge, ed => {
		func(cmap.cut_edge(ed, true));
	}, {cache: edge_cache});
}

/// edges already cut
export function quadrangulate_face(cmap, fd){
	let d0 = cmap.phi1[fd];
	let d1 = cmap.phi1[cmap.phi1[d0]];
	let ed = cmap.cut_face(d0, d1);
	let vd = cmap.cut_edge(ed);

	d0 = cmap.phi1[fd];
	d1 = cmap.phi1[cmap.phi1[d1]];
	do
	{
		cmap.cut_face(cmap.phi1[d0], d1);
		d1 = cmap.phi1[cmap.phi1[d1]];
	} while(d1 != d0);

	return vd;
}

export function quadrangulate_all_faces(cmap, edge_cut_func, face_cut_func){
	let face_cache = cmap.cache(cmap.face);
	cut_all_edges(cmap, edge_cut_func);
	cmap.foreach(cmap.face, fd => {
		face_cut_func(quadrangulate_face(cmap, fd));
	}, {cache: face_cache});
}

export function triangulate_face(cmap, fd){
	let d1 = cmap.phi1[fd];
	cmap.cut_face(fd, d1);
	cmap.cut_edge(cmap.phi_1[fd]);

	let d0 = cmap.phi2[cmap.phi_1[fd]];
	d1 = cmap.phi1[cmap.phi1[cmap.phi1[d0]]];
	let next;
	while(d1 != d0){
		next = cmap.phi1[d1];
		cmap.cut_face(d1, cmap.phi1[d0]);
		d1 = next;
	}

	return cmap.phi_1[fd];
}

export function triangulate_all_faces(cmap, func){
	let face_cache = cmap.cache(cmap.face);
	cmap.foreach(cmap.face, fd => {
		func(triangulate_face(cmap, fd));
	}, {cache: face_cache});
}