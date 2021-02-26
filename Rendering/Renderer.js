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
	this.vertices = (!vertex) ? undefined :
		Object.assign(Object.create(Renderer_Cell_Proto), {
			create: function(params = {}){
				this.params = params;
				const geometry = new THREE.SphereGeometry(1, 32, 32);	
				
				const material = params.material || new THREE.MeshLambertMaterial({
					color: params.color || 0xFF0000,
				});

				/// to handle none contiguous embeddings
				let max_id = -1;
				cmap.foreach(vertex, vd => {
					max_id = max_id < cmap.cell(vertex, vd) ? cmap.cell(vertex, vd) : max_id;
				}, {use_emb: cmap.is_embedded(vertex)});

				this.mesh = new THREE.InstancedMesh(geometry, material, max_id + 1);
				this.mesh.vid = []; 

				const size = params.size || 0.00625;
				let vec = new THREE.Vector3(size, size, size);
				
				let id = 0;
				cmap.foreach(vertex, vd => {
					const matrix = new THREE.Matrix4();
					matrix.setPosition(position[cmap.cell(vertex, vd)]);
					matrix.scale(vec);
					this.mesh.vid[id] = cmap.cell(vertex, vd); 
					this.mesh.setMatrixAt(id++, matrix);
				}, {use_emb: cmap.is_embedded(vertex)});

				this.mesh.layers.set(params.layer || 0);
				return this;
			}
		});

	if(!this.vertices)
		delete this.vertices;
	else
		this.cells.push(this.vertices);

	let edge = cmap.edge;
	this.edges = (!edge) ? undefined :
		Object.assign(Object.create(Renderer_Cell_Proto), {
			create: function(params = {}){
				this.params = params;


				const geometry = new THREE.CylinderGeometry(0.001, 0.001, 1, 8);
				const material = params.material || new THREE.MeshBasicMaterial({
					color: params.color || 0x000000,
				});

				this.mesh = new THREE.InstancedMesh(geometry, material, cmap.nb_cells(edge));
				this.mesh.layers.set(params.layer || 0);

				this.mesh.ed = [];
				let id = 0;
				cmap.foreach(edge, ed => {
					let p0 = position[cmap.cell(vertex, ed)];
					let p1 = position[cmap.cell(vertex, cmap.phi1[ed])];
					let dir = new THREE.Vector3().subVectors(p0, p1);
		
					let len = dir.length();
					let mid = new THREE.Vector3().addVectors(p0, p1).divideScalar(2);
					let dirx = new THREE.Vector3().crossVectors(dir.normalize(), new THREE.Vector3(0,0,1));
					let dirz = new THREE.Vector3().crossVectors(dirx, dir);

					const matrix = new THREE.Matrix4().fromArray([
						dirx.x, dir.x, dirz.x, mid.x,
						dirx.y, dir.y, dirz.y, mid.y,
						dirx.z, dir.z, dirz.z, mid.z,
						0, 0, 0, 1]).transpose();
					const matrix_scale = new THREE.Matrix4().makeScale(params.size || 1, len, params.size || 1);

					matrix.multiply(matrix_scale)
					this.mesh.setMatrixAt(id, matrix);
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
	this.faces = (!face) ? undefined :
		Object.assign(Object.create(Renderer_Cell_Proto), {
			create: function(params = {}){
				this.params = params;
				const geometry = new THREE.Geometry();
				geometry.vertices = position;

				cmap.foreach(face, fd => {
					let f_ids = [];
					cmap.foreach_dart_phi1(fd, d => {
						f_ids.push(cmap.cell(vertex, d));
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
					// console.log(0);
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