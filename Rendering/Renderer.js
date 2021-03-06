import * as THREE from '../Dependencies/three.module.js'

let Renderer_Cell_Proto = {
	mesh: undefined,
	params: undefined,
	create: undefined,

	add: function(parent){
		if(parent)
			parent.add(this.mesh);
		return this;
	},

	remove: function(){
		this.mesh.parent.remove(this.mesh);
		return this;
	},

	delete: function(){
		this.remove();
		// this.attributes.every(attrib => attrib.delete());
		this.mesh.geometry.dispose();
		delete this.mesh;
		return this;
	},

	update: function(params){
		let parent = this.mesh.parent;
		this.delete();
		this.create(params || this.params);
		this.add(parent);
		return this;
	},

	update_pos: function(){
		this.mesh.geometry.verticesNeedUpdate = true;
		return this;
	}
}


function Renderer(cmap){
	this.cells = [];
	const position = cmap.get_attribute(cmap.vertex, "position");

	let vertex = cmap.vertex;
	this.vertices = (vertex == undefined) ? undefined :
		Object.assign(Object.create(Renderer_Cell_Proto), {
			create: function(params = {}){
				this.params = params;
				// this.attributes = {};
				
				// this.attributes.instanceId = instanceId;
				// console.log(Object.entries(this.attributes))
				
				const geometry = new THREE.SphereGeometry(1, 32, 32);	
				
				const material = params.material || new THREE.MeshLambertMaterial({
					// opacity: 0.5,
					// transparent: true
				});

				/// to handle none contiguous embeddings
				let max_id = -1;
				cmap.foreach(vertex, vd => {
					max_id = max_id < cmap.cell(vertex, vd) ? cmap.cell(vertex, vd) : max_id;
				}, {use_emb: cmap.is_embedded(vertex)});

				this.mesh = new THREE.InstancedMesh(geometry, material, max_id + 1);
				this.mesh.vd = []; 
				this.mesh.instanceId = cmap.get_attribute(vertex, "instanceId")
				|| cmap.add_attribute(vertex, "instanceId");

				const size = params.size || 0.00625;
				const scale = new THREE.Vector3(size, size, size);
				
				let id = 0;
				cmap.foreach(vertex, vd => {
					const matrix = new THREE.Matrix4();
					matrix.setPosition(position[cmap.cell(vertex, vd)]);
					matrix.scale(scale);
					this.mesh.vd[id] = vd; 
					this.mesh.instanceId[cmap.cell(vertex, vd)] = id;
					this.mesh.setColorAt(id, (params.color || new THREE.Color(0xFF0000)))
					this.mesh.setMatrixAt(id++, matrix);
				}, {use_emb: cmap.is_embedded(vertex)});

				this.mesh.layers.set(params.layer || 0);
				return this;
			}, 

			// resize: function(size) {
			// 	const scale = new THREE.Vector3(size, size, size);
			// 	cmap.foreach(vertex, vd => {
			// 		const matrix = new THREE.Matrix4();
			// 		matrix.setPosition(position[cmap.cell(vertex, vd)]);
			// 		matrix.scale(vec);
			// 		this.mesh.vd[id] = vd; 
			// 		this.mesh.setColorAt(id, (params.color || new THREE.Color(0xFF0000)))
			// 		this.mesh.setMatrixAt(id++, matrix);
			// 	}, {use_emb: cmap.is_embedded(vertex)});
			// }
		});

	if(!this.vertices)
		delete this.vertices;
	else
		this.cells.push(this.vertices);

	let edge = cmap.edge;
	this.edges = (edge == undefined) ? undefined :
		Object.assign(Object.create(Renderer_Cell_Proto), {
			create: function(params = {}){
				this.params = params;

				const geometry = new THREE.CylinderGeometry(0.001, 0.001, 1, 8);
				const material = params.material || new THREE.MeshBasicMaterial({
					// color: params.color || 0x000000,
				});

				this.mesh = new THREE.InstancedMesh(geometry, material, cmap.nb_cells(edge));
				this.mesh.layers.set(params.layer || 0);

				if(!cmap.is_embedded(edge))
					cmap.set_embeddings(edge);

				this.mesh.instanceId = cmap.get_attribute(edge, "instanceId")
					|| cmap.add_attribute(edge, "instanceId");

				this.mesh.ed = [];
				let id = 0;
				const pos = new THREE.Vector3();
				const quat = new THREE.Quaternion();
				const scale = new THREE.Vector3();
				const p = [0, 0];
				cmap.foreach(edge, ed => {
					let i = 0;
					cmap.foreach_incident(vertex, edge, ed, vd => {
						p[i++] = position[cmap.cell(vertex, vd)];
					});
					let dir = new THREE.Vector3().subVectors(p[0], p[1]);
		
					let len = dir.length();
					let dirx = new THREE.Vector3().crossVectors(dir.normalize(), new THREE.Vector3(0,0,1));
					let dirz = new THREE.Vector3().crossVectors(dirx, dir);

					const matrix = new THREE.Matrix4().fromArray([
						dirx.x, dir.x, dirz.x, 0,
						dirx.y, dir.y, dirz.y, 0,
						dirx.z, dir.z, dirz.z, 0,
						0, 0, 0, 1]).transpose();
					
					matrix.decompose(pos, quat, scale);
					scale.set(params.size || 1, len, params.size || 1);
					pos.addVectors(p[0], p[1]).divideScalar(2);
					matrix.compose(pos, quat, scale);
					this.mesh.setMatrixAt(id, matrix);
					this.mesh.setColorAt(id, new THREE.Color(params.color || 0x000000));
					this.mesh.instanceId[cmap.cell(edge, ed)] = id;
					this.mesh.ed[id++] = ed;
				}, {use_emb: cmap.is_embedded(edge)});

				return this;
			}
		});

	if(!this.edges)
		delete this.edges;
	else
		this.cells.push(this.edges);

	let face = cmap.face;
	this.faces = (face == undefined) ? undefined :
		Object.assign(Object.create(Renderer_Cell_Proto), {
			create: function(params = {}){
				this.params = params;
				const geometry = new THREE.Geometry();
				geometry.vertices = position;

				cmap.foreach(face, fd => {
					let f_ids = [];
					cmap.foreach_incident(vertex, face, fd, vd => {
						f_ids.push(cmap.cell(vertex, vd));
					});

					let normal = params.normals? params.normals[cmap.cell(face, fd)] : undefined;
					for(let i = 2; i < f_ids.length; i++){
						let f = new THREE.Face3(f_ids[0],f_ids[i-1],f_ids[i], normal);
						geometry.faces.push(f);

						if(cmap.is_embedded(face))
							f.id = cmap.cell(face, fd);
					}
				}, {use_emb: cmap.is_embedded(face)});

				if(!params.normals) 
					geometry.computeFaceNormals();

				let material = params.material || new THREE.MeshLambertMaterial({
					color:params.color || 0xBBBBBB,
					side: params.side || THREE.FrontSide,
					transparent: params.transparent || false,
					opacity: params.opacity || 1
					// wireframe: true
				});

				this.mesh = new THREE.Mesh(geometry, material);
				this.mesh.layers.set(params.layer || 0);
				return this;
			}
		});

	if(!this.faces)
		delete this.faces;
	else
		this.cells.push(this.faces);

	let volume = cmap.volume;
	this.volumes = (!volume) ? undefined :
		Object.assign(Object.create(Renderer_Cell_Proto), {
			create: function(params = {}){
				this.params = params;

				let material;
				const colors = params.volume_colors;
				if(params.volume_colors){
					material = new THREE.MeshLambertMaterial({
						vertexColors: THREE.FaceColors,
						side: params.side || THREE.FrontSide
					});
				}
				else {
					material = params.material || new THREE.MeshLambertMaterial({
						color:params.color || 0xBBBBBB,
						side: params.side || THREE.FrontSide,
						transparent: params.transparent || false,
						opacity: params.opacity || 1
					});
				}
				this.mesh = new THREE.Group();

				if(!cmap.is_embedded(cmap.vertex2))
					cmap.set_embeddings(cmap.vertex2);

				let v2_id = cmap.add_attribute(cmap.vertex2, "v2_id");
				let mesh_center = new THREE.Vector3();
				let marker_vertices = cmap.new_marker(cmap.vertex2);
				let marker_faces = cmap.new_marker();
				let id = 0;
				let center = new THREE.Vector3();
				cmap.foreach(volume, wd => {
					if(cmap.is_boundary(wd))
						return;

					const geometry = new THREE.Geometry();
					center.set(0, 0, 0);
					/// replace with foreach incident vertex2
					id = 0;
					cmap.foreach_incident(cmap.vertex2, volume, wd, v2d => {
						v2_id[cmap.cell(cmap.vertex2, v2d)] = id++;
						
						center.add(position[cmap.cell(vertex, v2d)]);
						geometry.vertices.push(position[cmap.cell(vertex, v2d)].clone());}
						, true);

					center.divideScalar(id);
					for(let i = 0; i < geometry.vertices.length; ++i){
						geometry.vertices[i].sub(center);
					}
				
					/// replace with foreach incident face
					cmap.foreach_dart_of(volume, wd, fd => {
						if(marker_faces.marked(fd))
							return;

						let f_ids = [];
						cmap.foreach_dart_phi1(fd, vd => {
							f_ids.push(v2_id[cmap.cell(cmap.vertex2, vd)]);
							marker_faces.mark(vd);
						});

						for(let i = 2; i < f_ids.length; i++){
							let f = new THREE.Face3(f_ids[0],f_ids[i-1],f_ids[i]);
							geometry.faces.push(f);

							if(cmap.is_embedded(volume))
								f.id = cmap.cell(volume, fd);
						}

					});

					if(params.volume_colors){
						geometry.faces.forEach(f => f.color = colors[f.id].clone());
					}


					geometry.computeFaceNormals();
					let vol = new THREE.Mesh(geometry, material);
					vol.position.copy(center);
					vol.layers.set(params.layer || 0);
					this.mesh.add(vol);
					mesh_center.add(center);
				}, {use_emb: cmap.is_embedded(volume)});
				this.mesh.layers.set(params.layer || 0);
				marker_faces.remove();
				marker_vertices.remove();
				v2_id.delete();
				// mesh_center.divideScalar(this.mesh.children.length);
				// this.mesh.position.copy(mesh_center.negate());
				// this.mesh.children.forEach(vol => vol.position.sub(mesh_center));
				return this;
			},

			rescale: function(scalar){
				this.mesh.children.forEach(vol => vol.scale.set(scalar, scalar, scalar));
			}
		});

	if(!this.volumes)
		delete this.volumes;
	else
		this.cells.push(this.volumes);

	// let mesh = new THREE.Group();
	// this.create = function()
	// {
	// 	cells.forEach(cell => {

	// 	});
	// };

	// this.add = function(){};
	// this.add = function(){};
	// this.add = function(){};
	// this.add = function(){};
	// this.add = function(){};
}

export default Renderer;
export {Renderer_Cell_Proto};