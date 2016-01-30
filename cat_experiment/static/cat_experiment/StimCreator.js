
/**
 *Class housing the stimuli drawing capabilities
 * 
 * @param {object}	expDef				The set of options that will define the stimuli created by this instance of the drawer
 * @param {integer}	expDef.attNumber	how many microcomponent pairs to use to draw the stimuli
 * @param {integer} expDef.attSize		Microcomponents must be square images. This is the length in pixels of the side of the square.
 * @param {integer}	expDef.side			The number of microcomponents that will fit along one edge of the stimuli. Basically a density measure
 * @param {integer}	expDef.difficulty	The initial difficulty for which the stimuli will be used
 * @param {integer}	expDef.expLength	How many <strong>PAIRS</strong> of stimuli to create
 * @param {String}	expDef.path			The path to the folder containing the microcomponents 
 */
function StimCreator(expDef, canvas){

    // how many attributes are used to create the stimuli used in this run 
    var numberOfAttributes = expDef.attNumber;
    var checkAllLoaded = numberOfAttributes * 2;

    //keeps track of how many attributes have been actually loaded
    var loadedAttributes = 0;

    //The vectorial description of all stimulus pairs are stored here once created, 2D array
    var stimulusMatrix = [];

    this.getStimulusMatrix = function () {
        return stimulusMatrix.slice(0);
    }

    //record the distances of the pairs, might be useful for experimental analysis
    var distances = [];

    this.getDistances = function () {
        return distances.slice(0);
    }
	
    //Actual Image objects. 2D array. Each pair represents the 0 and 1 value of the attribute at this index
    var attributes = [];

    //length of the side of the attribute images, in pixels
    var attSize = expDef.attSize;

    //how many attributes should fit on one side of the stimuli, indirectly determines the pixel size of the stimuli
    var side = expDef.side;

    //the javascript canvas context object to be used for drawing
    var canvasContext = canvas.getContext("2d");

    //The canvas object where we will draw the stimuli
    //var canvas = canvas;

    //diffculty chosen for this run
    var difficulty = expDef.difficulty;

    //how many stimulus pairs should be created
    var expLength = expDef.expLength;

    //the invariant attribute-value pairs that define the L class
    var invariantsL = [];

    //the invariant attribute-value pairs that define the K class
    var invariantsK = [];

    this.getInvariants = function(){
        return [invariantsK, invariantsL];
    };

    //the attribute index numbers that are free to vary randomly when creating stimuli
    var freeAttributes = [];

    //an array of key values pairs that describes how many pairs of each distance should be created
    var distanceDistribution = expDef.distanceDistribution;

    //Finally, this array will contain the data URIs of the actual, finished stimuli, ready to be fed to the experiment
    var stimuli = [];

    this.getStimuli = function(){
        return stimuli.slice(0);
    }

    //path to the attribute folder
    var path = expDef.path;

    //stupid ECMA bug fix to make "this" behave properly in inner functions AAAAAAARRRRRRRRGGGGGHHHHH
    var that = this;

    //takes the difficulty requeste and fills the invariant definitions of  the K and L class using random attributes
    function setInvariants(){
        var possibleAttributes = [];
        
        for(var i=0; i< numberOfAttributes; i++){
		    possibleAttributes.push(i);
	    }
	    var difficultyCursor = difficulty;
	    while (difficultyCursor > 0) {
	        //choose which of the possible attributes will be set, and remove it from the pool of selectable attributes
	        var randomIndex = Math.floor(Math.random() * possibleAttributes.length);
	        var chosen = possibleAttributes.splice(randomIndex, 1)[0];

            var randomValueK = Math.floor(Math.random()*2);
		
		    //ensure we set it at an opposite value for the L class
		    var randomValueL;
		    if(randomValueK === 1){
			    randomValueL = 0;
		    }
		    else{
			    randomValueL = 1;
		    }
		    invariantsK.push([chosen, randomValueK]);
		    invariantsL.push([chosen, randomValueL]);
	        difficultyCursor = difficultyCursor - 1;
	    }

	    freeAttributes = possibleAttributes;
    }

    /**
     * 
     * 
 	 * @param {object} definition
     */
    function drawStim(definition){
	    var repeatsPerAttribute = Math.ceil(Math.pow(side,2)/difficulty);
	    var index = 0;
	    var sizeOfStim = attSize*side;
	    var pool = [];
	    for (var a = 0; a < numberOfAttributes; a++ ){
	        pool.push(a);
	    }
	    shuffle(pool);
	    // var attOrder = generatePool(expDescription.difficulty, repeatsPerAttribute);	Deprecated as per laboratory instructions
	        for (var x = 0; x < sizeOfStim; x = x + attSize){
	            for (var y = 0; y < sizeOfStim; y = y + attSize){
	                if(index === pool.length){
	                    shuffle(pool);
	                    index = 0;
	                }
	                var attToBeDrawn = pool[index];
                    var imageToBeDrawn = attributes[attToBeDrawn][definition[attToBeDrawn]];
                    canvasContext.drawImage(imageToBeDrawn, x, y);
	                index++;
	            }
	        }
            //now that the image is complete, convert to data URI and return it.
	        var imgAsDataURL =  canvas.toDataURL();
            //clear the canvas for the next image
	        canvasContext.clearRect(0, 0, sizeOfStim, sizeOfStim);
	        return imgAsDataURL;
    }
    
    

    //event listener used to launch creation exactly when all attribute images are loaded
    function attLoadingCallbackFct (stimuliCreation){
        loadedAttributes++;
        if(loadedAttributes === checkAllLoaded){
            actuallyStartDrawing(stimuliCreation);
        }
    }

    //helper function to shuffle stuff
    function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
    }

    //public method. launches the stimuli creation process
    this.loadAndGo = (function () {
        //deferred object representing the task of creating the stimuli
        var stimuliCreation = $.Deferred();
        loadedAttributes = 0;
        var workingPath = path.slice(0) + "att";
        for (var i = 0; i < numberOfAttributes; i++) {
            var imgTuple = []
            var att1 = new Image();
            var att2 = new Image();
            att1.onload = function () {
                attLoadingCallbackFct(stimuliCreation);
            }
            att2.onload = function () {
                attLoadingCallbackFct(stimuliCreation);
            }
            att1.src = workingPath + (i + 1) + "A.png";
            att2.src = workingPath + (i + 1) + "B.png";
            imgTuple.push(att1);
            imgTuple.push(att2);
            attributes.push(imgTuple);


        }
        //return a promise that the stimuli will be created, used to trigger further steps at right time in the caller function
        return stimuliCreation.promise();
    });

    //private function that actually does the work, guaranteed to be called only after loading has completed
    function actuallyStartDrawing(stimuliCreation){

        //Decide the invariants and their values according to what the difficulty is set to
        setInvariants();
        //make sure the canvas is exactly the same size of our stimuli to avoid blank spaces
        canvas.width = side * attSize;
        canvas.height = side * attSize;

        //Now we start describing the order of the pairs that will be presented
        var checkCorrectDistribution = 0;

        //for every entry in the distanceDistribution, we add the correct amount of numbers in the distances array
        // eg if we requested ['lk4',60] (60 pairs of distance 'lk4'), we add the code "lk4" 60 times in this.distances
        for(var i=0; i < distanceDistribution.length; i++){
            var distanceRequested = distanceDistribution[i][0];
            var effectif = distanceDistribution[i][1];
            checkCorrectDistribution += effectif;

            for(var j=0; j<effectif; j++){
                distances.push(distanceRequested);
            }
        }

        //we ensures that the distribution adds up to the specified total number of stimuli pairs requested
        if(checkCorrectDistribution != expLength){
            throw "your requested distances do not match the length of the experiment!";
        }

        //now that the "this.distances" array contains one aplhanumerical code representing the desired pair per times the pair was actually requested, we will shuffle the presentation order
        shuffle(distances);

        //now simply iterate over the distances array and create one vector pair of the distance indicated at the current index. store them in the this.stimulusMatrix
        for(var k=0; k < distances.length; k++){
            var pair = generateVectorPair(distances[k]);
            stimulusMatrix.push(pair);
        }

        //now that the matrix descriptions are all stored in this.stimulusMatrix, iterate over them to create the actual data URI and store the images in this.stimuli

        //for(var n=0; n<stimulusMatrix.length; n++){
        //    stimuli.push([drawStim(stimulusMatrix[n][0]), drawStim(stimulusMatrix[n][1])])
        //}

        // well try the setTimeout fix to release a bit of cycles back to the UI
        function drawTimeOut(n){
            stimuli.push([drawStim(stimulusMatrix[n][0]), drawStim(stimulusMatrix[n][1])]);
            stimuliCreation.notify(n);

            if(stimulusMatrix[n+1]){
                setTimeout(function () {
                    drawTimeOut(n + 1);
                }, 5);
            }
            else{
                stimuliCreation.resolve();
            }
        }

        drawTimeOut(0);


        //signal up the callstack that we have finished creating the stimuli
        

    }

    //the request parameter must be a string of the form:"[two letter code][distance requested]"
    function generateVectorPair(request){
        var vectorPair = [];
        var type = request.slice(0, 2);
        var distance = request.slice(2);
        //"distance" is still a string, we want its integer value
        distance = parseInt(distance);

        //Detect and catch impossible requests
        if(distance > numberOfAttributes){
            throw "impossible request, the distance requested is more than the total number of possible attributes";
        }

        //start by simply copying the invariant definition for our two vectors. we will adjust them later
        var firstVector = invariantsK.slice(0);
        var secondVector = invariantsL.slice(0);

        //the number of attributes that will be fixed to opposite values among our two vectors. Here we assume we request images of two different classes
        //will be adjusted later if necessary 
        var mustBeDifferent = distance - difficulty;

        //simply a copy of the attributes that are free to vary and that we will work on
        var freeElements = freeAttributes.slice(0);
        
        if(type === "kl"){
            if(distance < difficulty){
                throw "invalid distance: less than the number of attributes fixed to be different by the difficulty";
            }
        }
        else if(type === "lk"){
            if(distance < difficulty){
                throw "invalid distance: less than the number of attributes fixed to be different by the difficulty";
            }
            var temp = firstVector;
            firstVector= secondVector.slice(0);
            secondVector = temp;
        }
        else if(type === "ll"){
            if(distance > freeElements.length){
                throw "invalid distance: more than can be created with the attributes free to vary";
            }
            firstVector = secondVector.slice(0);
            mustBeDifferent = distance;
        }
        else if(type === "kk"){
            if(distance > freeElements.length){
                throw "invalid distance: more than can be created with the attributes free to vary";
            }
            secondVector = firstVector;
            mustBeDifferent = distance;
        }
        else{
            throw "invalid request type";
        }

        
        shuffle(freeElements);

        while(mustBeDifferent>0){
            var chosenAtt = freeElements.pop();
            var valueK = Math.floor(Math.random()*2);
		    var valueL;
		    if(valueK === 1){
			    valueL = 0;
		    }
		    else{
			    valueL = 1;
		    }
		    firstVector.push([chosenAtt, valueK]);
		    secondVector.push([chosenAtt, valueL]);
		    mustBeDifferent--;
        }
        
        while(freeElements.length > 0){
            var chosenAtt = freeElements.pop();
            var valueK = Math.floor(Math.random()*2);
            var valueL = valueK;
            firstVector.push([chosenAtt, valueK]);
            secondVector.push([chosenAtt, valueL]);
        }

        return [simplifyDef(firstVector), simplifyDef(secondVector)];
    }

    //Converts a 2D representation of a stim (eg. [[2,0], [3,1]]) into a 1D using the first number as the array index.
    function simplifyDef(stimSpecification){
	var simpleDef = new Array(stimSpecification.length);
	for(var i=0; i<stimSpecification.length; i++){
		simpleDef[stimSpecification[i][0]]= stimSpecification[i][1];
	}
	return simpleDef;
    }
}