export function load_cg(cg_str){
	let lines = cg_str.split("\n");
	for(let i = 0; i < lines.length; i++)
	{
		lines[i] = lines[i].replace(/\s\s+/g, ' ').trim();
	}

	let line;
	let j = 0;
	line = lines[j++];
	let header = line.split(" ");
	let nb_dims = parseInt(header[1].split(":")[1]);
	let nb_verts = parseInt(header[2].split(":")[1]);
	let nb_edges = parseInt(header[3].split(":")[1]);

	let vertices = [];
	for(let i = 0; i < nb_verts; ++i)
	{
		line = lines[j++];
		vertices.push(line.slice(2).split(" "));
	}

	let edges = [];
	for(let i = 0; i < nb_edges; ++i)
	{
		line = lines[j++];
		edges.push(line.slice(2).split(" "));
	}

	vertices = vertices.map(x => x.map(y => parseFloat(y)));
	edges = edges.map(x => x.map(y => (parseInt(y) - 1)));
	
	return {v: vertices, e:edges};
};

export function save_cg(geometry){

};