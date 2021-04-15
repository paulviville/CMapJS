/// Attributes are arrays linked to an attribute container
function Attribute(array, attributes_container, name, length){
	array.name = name;
	array.length = length;

	/// clears the array and removes it's reference from it's container
	array.delete = function(){
		attributes_container.removeAttribute(this.name);
		this.length = 0;
		delete this.delete;
		delete this.name;
	};

	return array;
};


/// Attributes containers handle attributes and index setting
export default function AttributesContainer(){
	/// creates and stores a new attribute of given name
	this.createAttribute = function(name = ""){
		while(name == "" || attributes[name])
			name += "_";

		let attribute = new Attribute([], this, name, max_id);
		attributes[name] = attribute;
		
		return attribute;
	};

	/// deletes reference to attribute of given name
	this.removeAttribute = function(name){
		delete attributes[name];
	};

	/// gets reference to attribute of given name
	/// returns undefined if attribute doesn't exist
	this.getAttribute = function(name){
		// if(!attributes[name])
		// 	console.warn("No attribute named: ", name);

		return attributes[name];
	};

	/// creates an index for new element in all attributes
	this.new_element = function(){
		let index;
		if(free_indices.size){
			let id = free_indices.values().next().value;
			free_indices.delete(id);
			index = id;
		}
		else{
			Object.values(attributes).forEach(
				attribute => ++(attribute.length)
			);
			index = max_id++;
		}
		refs[index] = 0;
		return index;
	};

	/// frees given index
	this.deleteElement = function(index){
		refs[index] = null;
		free_indices.add(index);
	};

	/// returns number of referenced elements
	this.nbElements = function(){
		return max_id - free_indices.size;
	};

	/// returns number of attributes in the container
	this.nb_attributes = function(){
		return Object.keys(attributes).length;
	};

	/// increases reference counter of given index
	this.ref = function(index){
		++refs[index];
	};

	/// decreases reference counter of given index
	/// deletes element of given index if counter reaches 0
	this.unref = function(index){
		if(!refs[index])
			return; 
		if(!(--refs[index])) 
			this.deleteElement(index);
	};

	/// clears attribute container of all data
	this.delete = function(){
		free_indices.clear();
		max_id = 0;
		Object.keys(attributes).forEach(attr => attributes[attr].delete());
		Object.keys(this).forEach(key => delete this[key]);
	};

	/// Currently unused ids
	const free_indices = new Set();
	/// All attributes contained by this container
	const attributes = {};
	/// id counter
	let max_id = 0;
	/// attribute counting number of references to each element
	const refs = this.createAttribute("<refs>");
};
