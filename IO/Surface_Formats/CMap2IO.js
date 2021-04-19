import {CMap2} from '../../CMap/CMap.js';
import {Vector3} from '../../Libs/three.module.js';
import {loadOff, exportOff} from './Off.js';

export function loadCMap2(format, file_str){
	let geometry = geometryFromStr(format, file_str);
	let map = mapFromGeometry(geometry);
	console.log("loaded file: " + format + " (v:" + geometry.v.length + ", f:" + geometry.f.length + ")");
	return map;
}

export function geometryFromStr(format, file_str){
	let geometry;
	switch(format){
		case 'off':
			geometry = loadOff(file_str);
			break;
		default:
			break;
	}
	return geometry;
}

function mapFromGeometry(geometry){
	let map = new CMap2;
	let position = map.addAttribute(map.vertex, "position");
	let dart_per_vertex = map.addAttribute(map.vertex, "dart_per_vertex");

	// let mid = new Vector3(-0.7710000000000008, 0.8262499999999999, 0.2458000000000009);
	// let str = "";
	// let axisX = new Vector3(1, 0 ,0);
	// let axisY = new Vector3(0, 1 ,0);
	// let axisZ = new Vector3(0, 0,1);

	let vertex_ids = [];
	geometry.v.forEach(vertex => {
		let i = map.newCell(map.vertex);
		vertex_ids.push(i);
		dart_per_vertex[i] = [];
		position[i] = new Vector3(vertex[0], vertex[1], vertex[2]);

		// let p = new Vector3(vertex[0], vertex[1], vertex[2]);
		// p.sub(mid)
		// p.divideScalar(57);
		// p.applyAxisAngle(axisY, Math.PI)
		// .applyAxisAngle(axisY, Math.PI / 2);
		// str += p.x.toFixed(6) + " " + p.y.toFixed(6) + " " + p.z.toFixed(6) + "\n";
	});

	// console.log(str);

	map.setEmbeddings(map.vertex);
	geometry.f.forEach(face => {
		let d = map.addFace(face.length, false);
		for(let i = 0; i < face.length; i++){
			map.setEmbedding(map.vertex, d, face[i]);
			dart_per_vertex[face[i]].push(d);
			d = map.phi1[d];
		}
	});

	let v0 = -1;
	map.foreachDart(d0 => {
		v0 = map.cell(map.vertex, d0);
		dart_per_vertex[map.cell(map.vertex, map.phi1[d0])].forEach(d1 => {
			if(map.cell(map.vertex, map.phi1[d1]) == v0){
				map.sew_phi2(d0, d1);
			}
		});
	});

	map.close(true);
	dart_per_vertex.delete();

	return map;
}

export function exportCmap2(map, format){
	let geometry = geometryFromMap(map);
	console.log(geometry);
	let str = strFromGeometry(format, geometry);
	return str;
}

function strFromGeometry(format, geometry){
	let file_str;
	switch(format){
		case 'off':
			file_str = exportOff(geometry);
			break;
		default:
			break;
	}
	return file_str;
}

function geometryFromMap(map){
	let geometry = {v: [], e: [], f: []};
	const vertex = map.vertex;
	const edge = map.edge;
	const face = map.face;

	const position = map.getAttribute(vertex, "position");
	const vertex_id = map.addAttribute(vertex, "id");

	let id = 0;
	map.foreach(vertex, vd => {
		vertex_id[map.cell(vertex, vd)] = id++;
		const p = position[map.cell(vertex, vd)];
		geometry.v.push([p.x, p.y, p.z]);
	});

	map.foreach(face, fd => {
		let f = [];
		map.foreachDartOf(face, fd, d => {
			f.push(vertex_id[map.cell(vertex, d)]);
		});
		geometry.f.push(f);
	});

	vertex_id.delete();

	return geometry;
}