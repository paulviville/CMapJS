export function load_off(off_str) {
	let lines = off_str.split("\n");
	for(let i = 0; i < lines.length; i++)
	{
		lines[i] = lines[i].replace(/\s\s+/g, ' ').trim();
	}
	let line;
	// skip header
	while(!parseInt(line = lines.shift()) && lines.length)
	{}
	// get nb_vert nb_face nb_edge(=0)
	let v_f_e = line.split(" ");
	// get vertices positions
	let vertices = [];
	for(let i = 0; i < v_f_e[0]; i++)
	{
		line = lines.shift();
		vertices.push(line.split(" "));
	}        
	// get faces id
	let faces = [];
	for(let i = 0; i < v_f_e[1]; i++)
	{
		line = lines.shift();
		let face0 = line.split(" ");
		let v_nb = face0.shift();
		faces.push(face0);
	}
	vertices = vertices.map(x => x.map(y => parseFloat(y)));
	faces = faces.map(x => x.map(y => parseInt(y)));
	
	console.log("file loaded: " + vertices.length + " vertices, " + faces.length + " faces");
	return {v: vertices, f:faces};
}

export function export_off(geometry){
	
}