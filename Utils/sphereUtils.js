
import * as THREE from '../Libs/three.module.js';

export function slerp(A, B, alpha, out = false)
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

export function inSphereTriangle(P, U, V, W)
{
	let n0 = U.clone().cross(V);
	let n1 = V.clone().cross(W);
	let n2 = W.clone().cross(U);

	return (P.dot(n0) > 0 && P.dot(n1) > 0 && P.dot(n2) > 0);
}

export function inSphereFace(P, points)
{
	const bary = sphereBarycenter(points);

	let inside = false;
	for(let i = 0; i < points.length && !inside; ++i) {
		inside = inSphereTriangle(P, points[i], points[(i + 1) % points.length], bary);
	}

	return inside;
}

export function sphereAngle(A, B, C) {
	const sB = slerp(A, B, 0.01);
	const sC = slerp(A, C, 0.01);
	sB.sub(A);
	sC.sub(A);
	return sB.angleTo(sC);
}

export function distanceToGeodesic(P, A, B, out = false) {
	const planeNormal = A.clone().cross(B);
	const projP = P.clone().projectOnPlane(planeNormal);

	let AP = A.clone().cross(P);
	let PB = P.clone().cross(B);
	let inside = ((AP.dot(PB) > 0) && (!out));

	let dist = inside ? Math.abs(P.angleTo(projP)) : Math.min(onSphereDistance(A, P), onSphereDistance(B, P));

	return dist;
}

export function sphereBarycenter(points)
{
	let bary = new THREE.Vector3;
	points.forEach(p => {
			bary.add(p)
		});

	bary.normalize();

	if(points.length > 2)
	{
		let norm = new THREE.Vector3();
		let v0, v1, vc;
		for(let i = 2 ; i < points.length; ++i)
		{
			v0 = points[i - 1].clone().sub(points[0]);
			v1 = points[i].clone().sub(points[0]);
			vc = v0.clone().cross(v1);
			norm.add(vc);
		}
		norm.normalize();
		if(norm.dot(bary) < 0)
			bary.negate();

	}

	return bary;
}

export function onSphereDistance(A, B) {
	return Math.abs(A.angleTo(B));
}