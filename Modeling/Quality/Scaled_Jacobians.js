import {Vector3, Matrix3} from '../../three.module.js';

function compute_hex_frames(map){
	let vertex2 = map.vertex2;
	let vertex = map.vertex;
	let edge = map.edge;
	let volume = map.volume;

	let vertex2_frame = map.get_attribute(vertex2, "vertex2_frame");
	if(!vertex2_frame)
		vertex2_frame = map.add_attribute(vertex2, "vertex2_frame");

	let volume_frame = map.get_attribute(volume, "volume_frame");
	if(!volume_frame)
		volume_frame = map.add_attribute(volume, "volume_frame");

	let pos = map.get_attribute(vertex, "position");

	map.foreach(volume, wd => {
		let D = [];
		D[0] = wd;
		D[1] = map.phi1(wd);
		D[2] = map.phi1(D[1]);
		D[3] = map.phi1(D[2]);
		D[4] = map.phi1(map.phi1(map.phi2(D[0])));
		D[5] = map.phi1(map.phi1(map.phi2(D[1])));
		D[6] = map.phi1(map.phi1(map.phi2(D[2])));
		D[7] = map.phi1(map.phi1(map.phi2(D[3])));

		let P = [];
		P[0] = position[map.cell(vertex, D[0])];
		P[1] = position[map.cell(vertex, D[1])];
		P[2] = position[map.cell(vertex, D[2])];
		P[3] = position[map.cell(vertex, D[3])];
		P[4] = position[map.cell(vertex, D[4])];
		P[5] = position[map.cell(vertex, D[5])];
		P[6] = position[map.cell(vertex, D[6])];
		P[7] = position[map.cell(vertex, D[7])];

		let U = new Vector3;
		let V = new Vector3;
		let W = new Vector3;

		

		volume_frame[map.cell(volume, wd)] = new Matrix3;

	});

	return {vertex2_frame, volume_frame};
}

export function compute_scaled_jacobian(map){

}
