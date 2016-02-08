/**
 * @file Implements the drawing of stimuli and of pairs of stimuli with precise euclidean distance in feature space
 * @author - Daniel Rivas
 */

/**
 * The definition of a stimulus category; e.g for each invariant MC, the value to which it was fixed is provided
 * @typedef		{Object.<Integer, Integer|string>}	CategoryDef	Inside a CategoryDef, we find one property per invariant feature. property name is the index of that
 * 														invariant feature, property value is the value to which it has been fixed
 */


/**
 * Class that implements only the actual drawing of the stimuli. Especially does not handle setting the definitions and deciding
 * diagnostic features etc. All of this, including the actual micro-component imgs, have to be passed
 * 
 * @author 	Daniel Rivas
 * @date	2016-02-01
 * @type	
 * 
 * 
 * @param 	{Object}			opts		Options for stimuli creation
 * @param	{DOMElement}		opts.canvas	The HTML5 canvas element used to render the stimuli
 * @param	{Function}			opts.onDraw	Callback that will be called after every rendering of a single image
 * @param	{Object[]}			opts.mc		The micro-component (MC) pairs used to draw the stimuli, each given as a object with two Image objects	
 * @param	{Image}				opts.mc[].0	First MC in the pair
 * @param	{Image}				opts.mc[].1	Second MC in the pair
 * @param	{Object<String, CategoryDef>}		opts.types	Each available category coupled with the vectorial definition of its invariants
 * @param	{Integer}			opts.height	The number of MCs that would fit along the height of the finished stimuli.
 * @param	{Integer}			opts.width	The number of MCs that would fit along the width of the finished stimuli.
 */
function StimEngine(opts){
	//this is just declaring a module and unpacking the options, nothing to see here...
	var module={};
	var canvas = opts.canvas;
	var canvasContext = canvas.getContext('2d');
	var microComponents = opts.mc;
	var size = microComponents[0][0].width //take the first MC and check its width, assume all MC are squares of this size
	var pool=[];
	for(var i=0;i<microComponents.length; i++){
		pool.push(i);
	}
	
	//helper shuffle function
	function shuffle(array) {
	    for (var i = array.length - 1; i > 0; i--) {
	        var j = Math.floor(Math.random() * (i + 1));
	        var temp = array[i];
	        array[i] = array[j];
	        array[j] = temp;
	    }
	    return array;
	}
	
	function getDistance(first, second){
		var distance=0;
		microComponents.forEach(function(el, idx, ar){
			var one = first[idx];
			var two = second[idx];
			
			if(one != undefined && one !== 'free'){
				if(one !== two){
					distance++;
				}
			}
		});
		return distance;
	}
	
	function fillUp(repr){
		var touched=0;
		for(key in repr){
			if(repr.hasOwnProperty(key) && repr[key] == 'free'){
				repr[key] = Math.floor(Math.random()*2);
				touched++;
			}
		}
		return touched;
	}
	
	function findSingle(a, b){
		var hits={};
		[a, b].forEach(function(elt, i, array) {
			var other = i==0 ? b:a;
			for(var key in elt){
				if(elt.hasOwnProperty(key)){
					if(!other.hasOwnProperty(key) ){
						hits[key] = 'alone';
					}
				}
			}
		});
		return Object.keys(hits);
	}
	
	
	// I am deeply sorry for this terrible method but I had no choice...
	module.generateVectorPair = function generateVectorPair(firstType, secondType, distance){
		//every feature position that is not fixed in EITHER definition is a degree of liberty we can use to meet the distance requirement
		var firstType = jQuery.extend({}, firstType);
		var secondType = jQuery.extend({}, secondType);
		var inCommon =[];
		var alone = findSingle(firstType, secondType);
		//iterate through all the entries, sort those that are present in both
		for(a in firstType){
			if(firstType.hasOwnProperty(a)){
				if(secondType.hasOwnProperty(a)){
					inCommon.push(a);
				}
			}
		}
		
		distance = distance - alone.length;
		shuffle(inCommon);
	
		inCommon.forEach(function(elt, i, array) {
			// find a settable attribute
			var against;
			var settable = (function(){
				if(firstType[elt] == 'free'){
					against = secondType;
					return firstType;
				}
				else if(secondType[elt] == 'free'){
					against = firstType;
					return secondType;
				}
				else return null;
			})();
			
			if(settable){
				var other = against[elt];
				if(other == 'free'){
					other = Math.floor(Math.random() * 2);
				}
				if(distance > 0){
					settable[elt] = other == 0? 1:0;
					distance--;
				}
				else{
					settable[elt] = other;
				}
			}
			
		});
		
		if(distance > 0){
			throw "not enough settable attributes to achieve demanded vectorial distance";
		}
		fillUp(firstType);
		fillUp(secondType);
		return [firstType, secondType];
	}

	/**
	 * Draws one stimulus using the new and improved constraint-checking algorithm, now with no tail recursion and gluten-free!
	 * NOTE: I hope you realize that to ensure that no 2 adjacent cells contain the same element (in a 2d grid) you need a minimum of different elements.
	 * That minimum is 4. This function will fail unexpectedly if there are not at least 4 entries in opts.mc; have a good day!
	 * @param	{String}	def		Vector representation of the stimulus demanded. Array index is the number of the MC, the value at 
	 * 								That index is value of that MC
	 * @return	{DataURI}			The stimulus as a data URI string ready to be used in-browser
	 * @method
	 */
	module.singleDraw = function singleDraw(def){
		var struct = [];
		for(var i=0; i<opts.width; i++){
			struct[i]=[];
		}		
		//since I have decided to support different stimulus complexities, the pool of drawable MCs could change. Let's populate it
		var pool = Object.keys(def);
			
		function isDrawable(x, y){
			if(x<0 || y<0 || x>= opts.width || y>= opts.height){
				return false;
			}
			else if(struct[x][y] === 'done'){
				return false;
			}
			else return true;
		}
		
		var neighbors=[[-1,1], [0,1], [1,1], [1,0]];
		function spreadConstraints(x, y, val){
			neighbors.forEach(function(elem, idx, arr) {
				if(isDrawable(x+elem[0], y+elem[1])){
					struct[x+elem[0]][y+elem[1]].push(val);
				}
			});
		}
		
		//this is where the magic happens <3
		function drawSingleMC(x, y){
			if(isDrawable(x, y)){
				//get the list of forbidden MCs at that location
				var excluded = struct[x][y];
				//if this list is not empty, remove the forbidden elements from the pool of all MCs
				var remaining = pool;
				if(excluded != null){
					remaining = pool.filter(function(x){return excluded.indexOf(x) < 0}); // yeah its O(A*B) time but really, who cares?
				}
				//now that we kept only the allowed MCs, choose one at random
				var chosen = remaining[Math.floor(Math.random() * remaining.length)];
				//Actually draw it on the <canvas>
				canvasContext.drawImage(microComponents[chosen][def[chosen]], x*size, y*size);
				//mark that location as done
				struct[x][y] = 'done';
				//mark nearby locations not to allow that same MC that we just drew
				spreadConstraints(x, y, chosen);
			}
			else{
				return;
			}
		}
		for(var i=0; i< opts.width; i++){
			for(var j=0; j< opts.height; j++){
				drawSingleMC(i, j);
			}
		}
		var image = canvas.toDataURL();
		canvasContext.clearRect(0, 0, opts.width*size, opts.height*size);
		return image;
	}
	
	/***************************************** PUBLIC API ***************************************/
	
	module.drawPair = function(first, second){
		return [singleDraw(first), singleDraw(second)];
	}
	
	module.setComponents = function setComponents(comps){
		microComponents = comps;
		var size = microComponents[0][0].width //take the first MC and check its width, assume all MC are squares of this size
		pool = [];
		for(var i=0;i<microComponents.length; i++){
			pool.push(i);
		}
	}
	
	return module;
}