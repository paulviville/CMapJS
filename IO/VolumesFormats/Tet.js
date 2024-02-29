export function loadTet(tetStr) {
	let lines = tetStr.split("\n");
	for(let i = 0; i < lines.length; i++)
	{
		lines[i] = lines[i].replace(/\s\s+/g, ' ').trim();
	}

	let line;
	let j = 0;

	
	const nbVertices = parseInt(line = lines[j++]);
	const nbTets = parseInt(line = lines[j++]);
	console.log(nbVertices, nbTets)

	const vertices = [];
	for(let i = 0; i < nbVertices; i++)
	{
		line = lines[j++];
		vertices.push(line.split(" ").map(x => parseFloat(x)));
	}  
	
	const tets = [];
	for(let i = 0; i <nbTets; i++)
	{
		line = lines[j++];
		line = line.split(" ").map(x => parseInt(x));
		line.shift();
		tets.push(line);
	}            
	// // get faces id
	// let faces = [];
	// for(let i = 0; i < v_f_e[1]; i++)
	// {
	// 	line = lines[j++];
	// 	let face0 = line.split(" ");
	// 	let v_nb = face0.shift();
	// 	faces.push(face0);
	// }
	// vertices = vertices.map(x => x.map(y => parseFloat(y)));
	// faces = faces.map(x => x.map(y => parseInt(y)));
	console.log(vertices)
	return {v: vertices, tet:tets};
}

export function exportTet(geometry){
	// let str = "OFF\n";
	// str += geometry.v.length + " " + geometry.f.length + " 0\n";

	// geometry.v.forEach(
	// 	vert => {
	// 		str += vert[0] + " " + vert[1] + " " + vert[2] + "\n";
	// });
	// geometry.f.forEach(
	// 	face => {
	// 		str += face.length + " ";
	// 		face.forEach(vert => {str += vert + " "}); 
	// 		str += "\n";
	// 	});
	return str;
}