import * as THREE from '../Dependencies/three.module.js';
import {Renderer_Cell_Proto} from './Renderer.js';
import Renderer from './Renderer.js';

function slerp(A, B, alpha, out = false)
{
	let sl = new THREE.Vector3();
	let phi = A.angleTo(B);
	if(out) phi = phi - 2*Math.PI;
	let s0 = Math.sin(phi*(1-alpha));
	let s1 = Math.sin(phi*alpha);
	let s2 = Math.sin(phi);
	sl.addScaledVector(A, s0 / s2);
	sl.addScaledVector(B, s1 / s2);
	return sl;
}

function new_geodesic(A, B, nb_divs = 200, out = false)
{
	let geodesic = [];
	let phi = A.angleTo(B);
	if(out) phi -= 2*Math.PI;
	let s2 = Math.sin(phi);
	let s0 = 0;
	let s1 = 0;
	let alpha = 0;
	for(let i = 0; i <= nb_divs; i++)
	{
		let p = new THREE.Vector3();
		alpha = i / nb_divs;
		s0 = Math.sin(phi*(1-alpha));
		s1 = Math.sin(phi*alpha);
		p.addScaledVector(A, s0 / s2);
		p.addScaledVector(B, s1 / s2);
		geodesic.push(p);
	}
	return geodesic;
}

function subdivide_triangle(A, B, C, divs)
{
	if(divs < 2) 
		return [A, B, C];

	let vertices = [];
	for(let i = 0; i <= divs; ++i)
	{
		let ab = slerp(A, B, i / divs);
		let ac = slerp(A, C, i / divs);
		if(i == 0)
			vertices.push(ab);
		else
			for(let j = 0; j <= i; ++j)
				vertices.push(slerp(ab, ac, j / i));
	}

	return vertices;
}


export default function Renderer_Spherical(cmap){
	Renderer.call(this, cmap);
	const position = cmap.get_attribute(cmap.vertex, "position");

	let vertex = cmap.vertex;
	let edge = cmap.edge;
	this.geodesics = (!edge) ? undefined : Object.assign(Object.create(Renderer_Cell_Proto), {
		create: function(params = {}){
			this.params = params;
			const geometry = new THREE.Geometry();
			cmap.foreach(edge, ed => {
				let geodesic = new_geodesic(
					position[cmap.cell(vertex, ed)],
					position[cmap.cell(vertex, cmap.phi1[ed])]
				);
				for(let i = 1; i < geodesic.length; ++i){
					geometry.vertices.push(geodesic[i - 1], geodesic[i]);
				}
				
			}, {use_emb: cmap.is_embedded(edge)});

			const material = params.material || new THREE.LineBasicMaterial({
				color: params.color || 0x000000,
				linewidth: params.width || 2,
				polygonOffset: true,
				polygonOffsetFactor: -0.5
			});

			this.mesh = new THREE.LineSegments(geometry, material);
			this.mesh.layers.set(params.layer || 0);
			return this;
		}
	});

	let face = cmap.face;
	this.curved_faces = (!face) ? undefined : true;
}