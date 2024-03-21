import Attribute from "./Attribute.js";


export default class AttributeContainer {
	#attributes;
	#nextIndex;
	#unallocatedIndices;
	#refs;
	#capacity;

	constructor () {
		this.#attributes = new Map;
		this.#nextIndex = 0;
		this.#unallocatedIndices = new Set;
		this.#refs = this.addAttribute("<refs>");
		this.#capacity = 100;
	}

	addAttribute ( attributeName ) {
		let name = attributeName;
		while(this.#attributes.has(name)) {
			name += "_";
		}

		const attribute = new Attribute(name, this.#capacity);
		this.#attributes.set(name, attribute);
		
		return attribute;
	}

	getAttribute ( attributeName ) {
		return this.#attributes.get(attributeName);
	}

	getOrAddAttribute ( attributeName ) {
		return this.getAttribute(attributeName) ?? this.addAttribute(attributeName);
	}

	removeAttribute ( attribute ) {
		attribute.delete();
		this.#attributes.delete(attribute.name);
	}

	*attributes ( ) {
		yield* this.#attributes.values();
	}

	get nbAttributes ( ) {
		return this.#attributes.size;
	}

	newElement ( ) {
		let id = this.#unallocatedIndices.shift();
		id ??= this.#nextIndex++;
		this.#refs[id] = 0;

		if(this.#nextIndex == this.#capacity)
			this.#resize();
	}

	deleteElement ( index ) {
		this.#refs[index] = -1;

		if(index == this.#nextIndex - 1) {
			--this.#nextIndex;
		}
		else {
			this.#unallocatedIndices.add(index);
		}
	}

	get nbElements ( ) {
		return this.#nextIndex - this.#unallocatedIndices.size;
	}

	#resize ( ) {
		const capacityIncrease = 100;
		this.#capacity += capacityIncrease;
		for(const attribute of this.attributes()) {
			attribute.resize(this.#capacity);
		}
	}

	ref ( index ) {
		++this.#refs[index];
	}

	unref ( index ) {
		if(--this.#refs[index] == 0)
			this.deleteElement(index);
	}

	clear ( ) {
		for(const attribute of this.attributes()) {
			this.removeAttribute(attribute);
		}
	}

	*elements ( ) {
		for(let index = 0; index < this.#nextIndex; ++index) {
			if(this.#refs[index] > 0)
				yield index;
		}
	}
}