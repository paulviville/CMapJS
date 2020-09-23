import * as THREE from './three.module.js'

function Renderer(cmap)
{
	// let cells = [];
	const position = cmap.get_attribute(cmap.vertex, "position");

	let vertex = cmap.vertex;
	this.vertices = (!vertex) ? undefined : {
		mesh: undefined,
		params: {},
		create: function(params = {})
		{
			this.params = params;
			const geometry = new THREE.Geometry();
			cmap.foreach(vertex, vd => {
				geometry.vertices.push(position[cmap.cell(vertex, vd)])
			});

			let material = new THREE.PointsMaterial(
			{
				color: params.color || 0xFF0000,
				size: params.size || 0.0025
			});
			this.mesh = new THREE.Points(geometry, material);
		},
		add: function(parent)
		{
			if(parent)
				parent.add(this.mesh);
		},
		remove: function()
		{
			this.mesh.parent.remove(this.mesh);
		},
		delete: function()
		{
			this.remove();
			this.mesh.geometry.dispose();
			delete this.mesh;
		},
		update: function(params)
		{
			let parent = this.mesh.parent;
			this.delete();
			this.create(params || this.params);
			this.add(parent);
		},
		update_pos: function()
		{
			this.mesh.geometry.verticesNeedUpdate = true;
		}
	}

	if(!this.vertices)
		delete this.vertices;
	// else
	// 	cells.push(this.vertices);


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