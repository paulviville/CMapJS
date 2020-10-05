export function load_mesh(mesh_str) {
	let lines = mesh_str.split("\n");
	for(let i = 0; i < lines.length; i++)
	{
		lines[i] = lines[i].replace(/\s\s+/g, ' ').trim();
	}
	let line;
	// skip header
	// MeshVersionFormatted 1
	line = lines.shift();
	line.match(/MeshVersionFormatted 1/);
	console.log(line);
	// Dimension
	line = lines.shift();
	line.match(/Dimension/);
	console.log(line);
	// 3
	line = lines.shift();
	parseInt(line) == 3;
	console.log(line);

	/// vertex handling
	
	line = lines.shift();
	line.match(/Vertices/);

	line = lines.shift();
	let nb_vertices = parseInt(line);
	console.log(nb_vertices);
	// get vertices positions
	let vertices = [];
	for(let i = 0; i < nb_vertices; ++i)
	{
		line = lines.shift();
		line = line.split(" ");
		line.length = 3;
		vertices.push(line);
	}        
	console.log(vertices);
	// get quads (useless)
	line = lines.shift();
	line.match(/Quads/);
	console.log(line);
	line = lines.shift();
	let nb_quads = parseInt(line);
	console.log(nb_quads);
	let quads = [];
	for(let i = 0; i < nb_quads; ++i)
	{
		line = lines.shift();
		line = line.split(" ");
		line.length = 4;
		quads.push(line);
	}   
	console.log(quads);

	// get hex id
	line = lines.shift();
	line.match(/Hexahedra/);
	console.log(line);
	line = lines.shift();
	let nb_hexs = parseInt(line);
	console.log(nb_hexs);
	let hexes = [];
	for(let i = 0; i < nb_hexs; ++i)
	{
		line = lines.shift();
		line = line.split(" ");
		line.length = 8;
		hexes.push(line);
	}   
	console.log(hexes);

	// vertices = vertices.map(x => x.map(y => parseFloat(y)));
	// hexes = hexes.map(x => x.map(y => parseInt(y)));
	
	console.log("file loaded: " + vertices.length + " vertices, " + hexes.length + " faces");
	return {v: vertices, quad: quads, hex:hexes};
}

export function export_mesh(geometry){
	
}