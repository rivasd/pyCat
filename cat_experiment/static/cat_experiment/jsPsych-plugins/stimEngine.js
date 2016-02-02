/**
 * Class that implements only the actual drawing of the stimuli. Especially does not handle setting the definitions and deciding
 * diagnostic features etc. All of this, including the actual micro-component imgs, have to be passed
 * 
 * @author 	Daniel Rivas
 * @date	2016-02-01
 * @type	
 * 
 * 
 * @param 	{Object}	opts		Options for stimuli creation
 * @param	{jQuery}	opts.canvas	jQuery selection of the HTML canvas element used to render
 * @param	{Function}	opts.onDraw	Callback that will be called after every rendering of a single image
 * @param	{Object[]}	opts.mc		The micro-component (MC) pairs used to draw the stimuli, each given as a object with two Image objects	
 * @param	{Image}		opts.mc[].0	First MC in the pair
 * @param	{Image}		opts.mc[].1	Second MC in the pair
 * @param	{Object}	opts.types	Dictionary of definitions for each type of image available. keys are name of category, value is an array like [index of component, set value of that component]
 * @param	{Integer}	opts.height	The number of MCs that would fit along the height of the finished stimuli.
 * @param	{Integer}	opts.width	The number of MCs that would fit along the width of the finished stimuli.
 */
function StimEngine(opts){
	//this is just declaring a module and unpacking the options, nothing to see here...
	var module={};
	var $canvas = opts.canvas;
	var canvasContext = $canvas.get()[0].getContext('2d');
	var size = opts.mc[0][0].width //take the first MC and check its width, this to tell
	
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
	
	
	function simpleDraw(type){
		var index = 0;
		var pool = [];
		for(var i=0; i<opts.mc.length; i++){
			pool.push(i);
		}
		shuffle(pool);
		
		for(var x=0; x<opts.width; x++){
			for(var y=0; y<opts.height, y++){
				if(index === pool.length){
					shuffle(pool);
					index=0
				}
				
				index++;
			}
		}
	}
	
	simpleDraw(5);
	
	return module;
}

StimEngine({mc: [2,2,3,1]})