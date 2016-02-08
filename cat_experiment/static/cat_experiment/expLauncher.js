/**
 * Main manager and creator of experimental design
 * 
 * @requires jsPsych
 * @param opts
 */
function ExpLauncher(opts){
	var module ={};
	
	/** @type {StimEngine} */
	var engine = StimEngine(opts);
	
	
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
			for(var cur=0; cur<array.length; cur++){
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
	module.createRawSimilarityTimeline = function(names, distances, length){	
		var pairs = getAllPairs(names);
		var typesOfTrials = pairs.length * distances.length;
		var multiplier = Math.floor(length/typesOfTrials) + 1;
		var rawTimeline = jsPsych.randomization.factorial({'pairLabel': pairs, 'distance': distances}, multiplier, false);
		
		rawTimeline.forEach(function(elt, i, array) {
			var extraData = {};
			extraData.firstStim = elt.pairLabel[0];
			extraData.secondStim = elt.pairLabel[1];
			extraData.type = extraData.firstStim == extraData.secondStim ? 'same' : 'different';
			extraData.distance = elt.distace;
			elt.data = extraData;
		});
		return rawTimeline.slice(0, length);
	}
	
	/**
	 * takes a raw similarity timeline as returned by {@link ExpLauncher#createRawSimilarityTimeline}, your vectorial definitions of stimulus invariants, and return
	 * A jsPsych timeline of similarity trials but not quite with real images, but a full vectorial definition for each stimuli ready to be created via a call to {@link stimEngine#}
	 * 
	 * 
	 */
	module.createVectorialSimilarityTimeline = function(rawTimeline, definitions){
		var timeline=[];
		rawTimeline.forEach(function(rawTrial, i, array) {
			//first some sanity checks
			if(!(definitions.hasOwnProperty(rawTrial.pairLabel[0]) && definitions.hasOwnProperty(rawTrial.pairLabel[1]))){
				throw "seems you are not using the same category names used when creating the rawTrial argument";
			}
			var trial = {type:'similarity'};
			var vectors = engine.generateVectorPair(definitions[rawTrial.pairLabel[0]], definitions[rawTrial.pairLabel[1]], rawTrial.distance)
			trial.stimuli = vectors;
			trial.data = rawTrial.data;
			timeline.push(trial);
		});
		return timeline;
	};
	
	
	/**
	 * Given a jsPsych timeline where stimuli are actually vectorial representations instead of images, this function finds them, calls the engine rendering function and replaces the
	 * vectors with the actual images as Data URIs.
	 * @method
	 * @param	{Object[]}	vectorTimeline	An array of objects like that returned by {@link ExpLauncher#createVectorialTimeline}. must have a 'stimuli' property containing a vectorial def or an array of vectorial defs
	 * @param	{Function}	callback		a function to be called after every call to the engine rendering function. provided with two positional arguments: the index of the trial being currently processed, and the total number of trials to be processed.	
	 */
	module.replaceVectorsWithImage = function(vectorTimeline, callback){
		vectorTimeline.forEach(function(raw, i, array) {
			var multiple = raw.stimuli.length == undefined ? false : true;
			if(!multiple){
				raw.stimuli = engine.singleDraw(raw.stimulus)
			}
			else{
				var first = engine.singleDraw(raw.stimuli[0]);
				var second = engine.singleDraw(raw.stimuli[1]);
			}
			if(callback) callback(i, array.length);
		});
	};
	
	/**
	 * Creates a raw timeline of jsPsych categorization trials from a previously created raw similarity trials.If the demanded length
	 * is larger than the total number of stimuli in the given similarity timeline, stimuli will be repeated roughly uniformly until the total
	 * length matchesthe 'length' argument.
	 * 
	 * @param	{Array}						simTimeline	An array of trial-objects as returned by a call to {@link expLauncher#getSimTimelineWithImages} or alternatively to {@link expLauncher#getVectorialSimilarityTimeline} if you don't want actual stimuli in the trials but only vectorial representations
	 * @param	{Object<String, number>}	answers		A dictionnary assigning a keycode to a category name, one per allowed response.The category names used when creating the 'simTimelin' must be defined in this argument.
	 * @param	{Integer}					length		How many trials long should the resulting timeline be.
	 * @return	{Object[]}								An array of objects looking like jsPsych trials, but with names instead of actual stimuli					
	 */
	module.getCategorizationTimelineFromSim = function(simTimeline, answers, length){
		var timeline = [];
		
		simTimeline.forEach(function(trial, i, array) {
			var first = {type: 'categorize'};
			var second = {type: 'categorize'};
			first.stimulus = trial.stimuli[0];
			first.data = {category: trial.data.firstStim};
			first.key_answer = answers[first.stimulus];
			timeline.push(first);
			
			second.stimulus = trial.stimuli[1];
			second.data = {category: trial.data.secondStim};
			second.key_answer = answers[second.stimulus];
			timeline.push(second);
		});
		if(length > timeline.length){
			var fulltimeline = timeline.slice(0);
			//we need to multiply the current timeline to match the length;
			
			var multiplier = Math.floor(length / timeline.length) + 1;
			for(var i=0;i<multiplier;i++){
				timeline = timeline.concat(fulltimeline);
			}
			timeline = timeline.slice(0, length);
		}
		return timeline;
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
	
	module.
	
	
	/**
	 * Allows you to set the {@link StimEngine} object used to create the stimuli
	 * 
	 * @param	{StimEngine}	newEngine	The new {@link StimEngine} that will be used when calling some of this objects methods
	 */
	module.setEngine = function(newEngine){
		engine = newEngine;
	}
	
	return module;
}