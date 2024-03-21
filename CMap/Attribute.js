export default class Attribute extends Array {
	#name;

	constructor ( name = "", length = 0 ) {
		super(length);
		this.#name = name;    
	}

	get name () {
		return this.#name;
	}

	// clone () {	}

	// copy ( attribute ) {	}

	delete () {
		this.length = 0;
		this.#name = null; 
	}

	resize ( newLength ) {
		this.length = newLength;
	}
}