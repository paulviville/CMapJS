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
	// Dimension
	line = lines.shift();
	line.match(/Dimension/);
	// 3
	line = lines.shift();
	parseInt(line) == 3;

	/// vertex handling
	
	line = lines.shift();
	line.match(/Vertices/);

	line = lines.shift();
	let nb_vertices = parseInt(line);
	// get vertices positions
	let vertices = [];
	for(let i = 0; i < nb_vertices; ++i)
	{
		line = lines.shift();
		line = line.split(" ");
		line.length = 3;
		vertices.push(line);
	}        
	// get quads (useless)
	line = lines.shift();
	line.match(/Quads/);
	line = lines.shift();
	let nb_quads = parseInt(line);
	let quads = [];
	for(let i = 0; i < nb_quads; ++i)
	{
		line = lines.shift();
		line = line.split(" ");
		line.length = 4;
		quads.push(line);
	}   

	// get hex id
	line = lines.shift();
	line.match(/Hexahedra/);
	line = lines.shift();
	let nb_hexs = parseInt(line);
	let hexes = [];
	for(let i = 0; i < nb_hexs; ++i)
	{
		line = lines.shift();
		line = line.split(" ");
		line.length = 8;
		hexes.push(line);
	}   

	hexes = hexes.map(x => x.map(y => parseInt(y) - 1));
	quads = quads.map(x => x.map(y => parseInt(y) - 1));
	vertices = vertices.map(x => x.map(y => parseFloat(y)));
	console.log("file loaded: " + vertices.length + " vertices, " + hexes.length + " faces");
	return {v: vertices, quad: quads, hex:hexes};
}

export function export_mesh(geometry){
	
}