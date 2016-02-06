/**
 * Main manager and creator of experimental design
 * 
 * @requires jsPsych
 * @param opts
 */
function ExpLauncher(opts){
	var module ={};
	
	/**
	 * Helper method implementing Fisher-Yates shuffle
	 * @param	{Array}	The array to shuffle
	 * @return	{Array}	The shuffled array
	 */
	function shuffle(array) {
	    for (var i = array.length - 1; i > 0; i--) {
	        var j = Math.floor(Math.random() * (i + 1));
	        var temp = array[i];
	        array[i] = array[j];
	        array[j] = temp;
	    }
	    return array;
	}
	
	
	/**
	 * Helper method to return all possible pairs in a set. includes pairs made of the same set repeated twice.
	 * Used to build similarity judgment trials. DOES NOT recognize or deal with repeat entries
	 * 
	 * @param {Array}	list	array of things from which to generate all possible types of pairs
	 */
	function getAllPairs(list){
		var combinations = [];
		list.forEach(function(elt, i, array) {
			//combinations.push([elt, elt]);
			for(var cur=0, cur<array.length, cur++){
				combinations.push([elt, array[cur]]);
			}
		});
		return combinations;
	}
	
	/**
	 * Returns a list of objects containing the all the possible trials made by combining two images among the category names in 'names' and each available distance
	 * Each object is meant to represent a similarity judgment trial. A trials comprises two stimuli, each of a particular category among 'names' plus a vectorial distance among 'distances'
	 * this function will return an array of 'length' trials, with each subtype roughly uniformly represented (each trial object will be multiplied to exceed 'length', then the whole array will be truncated to match 'length' but after randomization)
	 * 
	 * 
	 */
	module.createSimilarityTimeline = function(names, distances, length){	
		var pairs = getAllPairs(names);
		var typesOfTrials = pairs.length * distances.length;
		var multiplier = Math.floor(length/typesOfTrials) + 1;
		
		
		
	}
	
	/**
	 * Creates definition objects, setting a number of their attributes to mutually exclusive values.
	 * 
	 * @param	{integer}	n		The number of categories to create. This implicitly defines the number of values a single attribute can take( if you ask for 4 categories, then each attribute must be able to assume 4 different values if these categories are to be orthogonal)
	 * @param	{integer}	size	The number of attributes each category definition will contain. This means all categories returned will have the same size and the same attribute numbers e.g. 0 through 'size'. You cannot for example have one category that does not have attribute 2 when the other has it.
	 * @param	{integer}	diff	how many of the above number of attributes must be set to values that are guaranteed to be different across the definitions. These attributes are chosen at random. The possible values are 0 through 'n'. For example if attribute number 3 is among the 'diff' attributes chosen to be different, then each category definition will have a different value at index '3'.
	 * @public
	 * @method
	 * 
	 * @return	{Array<Object>}		An array of size 'n', each entry being a category definition.
	 */
	module.createOrthogonalDefs = function(n, size, diff){
		if(diff > size){
			throw "the requested difficulty was higher than the degrees of freedom";
		}
		var definitions = [];
		var values = [];
		var attributes = [];

		for(var i=0; i<n; i++){
			var def={};
			for(var j=0; j<size; j++){
				def[j] = 'free';
				if(i==0){
					attributes.push(j); // only add to the attributes the first time around! almost missed that one...
				}
			}
			definitions.push(def);
			values.push(i);
		}
		var chosen = jsPsych.randomization.sample(attributes, diff, false);
		chosen.forEach(function(elem, idx, ar){
			shuffle(values);
			values.forEach(function(elt, i, array) {
				definitions[i][elem] = elt;
			});
		});
		return definitions;
	}
	
	
	
	return module;
}