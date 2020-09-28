import {Vector3} from '../../three.module.js';

export function vertex_normal(map, vd, position, face_normals){
	const position = attributes.position;
	let normal = new Vector3;
	if(face_normals)
	{
		/// average incident face normals from attribute
	}
	else
	{
		/// compute and average incident face normals 
	}
	return normal;
};

export function face_normal(map, fd, position){
	let normal = new Vector3;
	
};

export function compute_face_normals(map, position, face_normals){
	const normals = face_normals ? 
		face_normals : map.add_attribute(map.face, "face_normals");
	
	map.foreach(map.face, fd => {

	});
	return normals;
};

export function vertex_normals(map, attributes){

}
