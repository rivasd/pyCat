//Constructor for the experiment manager object
function ExperimentManager(targetElement){
    //stupid bug fix yada yada yada
    var self = this;
    //number of stimuli pairs to be used in this experiment
    var numberOfSimTrials;
    //number of times each stimuli will appear in the categorization task (how many times the stim array will be duplicated to form the presentation order of the categorization task)
    var stimRepeat;
    //id of the html document where the experiment will be displayed
    //var targetElement = params.targetElement;
    //number of pauses to be inserted during the categorization phase
    var numberOfPauses;
    //the length of one leg of the categorization task (how many trials between two pauses), calculated with the value above
    var legLength;
    //object containing the paths to both versions of the questionnaire html snippet, keyed by then language "fr" or "eng"
    var questionnaire;
    //object containing the instructions for the similarity judgment task (practice), both language versions
    var similarityInstructions;
    //object containing the instructions for the categorization task (practice), both language versions
    var categorizationInstructions;
    //short array containing the intro when introducing the real similarity judgment task
    var actualSimTaskInstructions;
    //short array containing the intro when introducing the real categorization task
    var actualCatTaskInstructions;
    //array containing the number of rows and columns of the table showing the demo of stimuli
    var sampleTableDimensions;
	//Instructions to be shown at the beginning of the experiment
    var generalInstructions;
	//final outro messages and thank yous
    var outro;
    //pixel size of the stimuli for the sample table
    var sampleSize;
    //display size of the actual stimuli during the experiment
    var stimDisplaySize;
    //path to the fixation cross
    var fixationCross;
    //array that will store the precise sequence of the types of stimuli pairs shown during both repeats of the similarity jugdment task
    var presentationOrder = [];
    //array that will store the actual stimuli pairs in the order described above
    var stimuliPairs = [];
    //same array of images as stimuliPairs, but in 1D form since we dont care abour pairs during the categorization task
    var stimuliForCategorizationTask = [];
    //answer key for the categorization trial
    var categorizationKey = [];
    //we store the same arrays here but for the training  tasks
    var trainingStimPairs = [];
    var trainingCatOrder = [];
    //Language in which the experiment was started
    var language = $('html').attr("lang");
	//the final experiment structure, in the right order
	var theExperiment=[];
	var startDate;
	var id;

	var catOptions;
    var simOptions;
    var sampleOptions;
    var pauseOptions;

    function get_lang(french, english) {
        if (document.documentElement.lang === 'fr') {
            return french;
        }
        else if (document.documentElement.lang === 'en') {
            return english;
        }
        else {
            throw "Unsupported language!";
        }
    }

    //General use fct to flatten any type of nested array into a 1D array, using stantard tree traversal
    function flatten(arr) {
      return arr.reduce(function (flat, toFlatten) {
        // See if this index is an array that itself needs to be flattened.
        if (toFlatten.some(Array.isArray)) {
          return flat.concat(flatten(toFlatten));
        // Otherwise just add the current index to the end of the flattened array.
        } else {
          return flat.concat(toFlatten);
        }
      }, []);
    };

    //the standard shuffling algorithm, but applied to two arrays simultaneously that will both be shuffled in the exact same way
    function dualShuffle(arr1, arr2){
        if(arr1.length !== arr2.length){
            throw "you can only simultaneously shuffle arrays of the same length!";
        }
        for(var i=arr1.length-1; i>0; i--){
            var j = Math.floor(Math.random() * (i+1));
            var temp = arr1[i];
            arr1[i] = arr1[j];
            arr1[j] = temp;

            temp = arr2[i];
            arr2[i] = arr2[j];
            arr2[j] = temp;
        }
    }

    //create the key array for the categorization task.
    //sorry for the random intermediate arrays and their terrible names
    function createKeyArray(){
        var keys = presentationOrder.slice(0);
        var answer = keys;
        for(var a=1; a< stimRepeat; a++){
            answer = answer.concat(keys);
        }
        var final = [];
        for(var n=0;n<answer.length; n++){
            var code = answer[n].slice(0, 2);
            code = code.toUpperCase();
            final.push(code.charCodeAt(0));
            final.push(code.charCodeAt(1));
        }
        categorizationKey = final;
    }

    //returns an HTML <table> element filled with randomly chosen stimuli to use as a preview
    this.generateSampleTable = function () {
        if (stimuliPairs.length === 0) {
            throw "Make sure to generate stimulie BEFORE sampling them (duh)";
        }
        //rearrange stimuli in 1D array if it has not been done already, easier to choose an image at random from a 1D array
        if (stimuliForCategorizationTask.length === 0) { stimuliForCategorizationTask = flatten(stimuliPairs); }

        var totalNumberOfSamples = sampleTableDimensions[0] * sampleTableDimensions[1];
        var table = document.createElement("table");
        for (var i = 0; i < sampleTableDimensions[0]; i++) {
            var row = document.createElement("tr");
            for (var j = 0; j < sampleTableDimensions[1]; j++) {
                var sampleImage = new Image(sampleSize, sampleSize);
                var td = document.createElement("td");
                var randomPosition = Math.floor(Math.random() * stimuliForCategorizationTask.length);
                sampleImage.src = stimuliForCategorizationTask[randomPosition];
                td.appendChild(sampleImage);
                row.appendChild(td);
            }
            table.appendChild(row);
        }
        return table.outerHTML;
    }

    //form validation logic for the questionnaire/pause form
    function processQuestionnaire(block) {

        var difficulties = $('form input[name=difficulty]:checked');
        var foundOptions = $('form input[name=ruleFound]:checked');
        var ruleDescription = $('form textarea[name=ruleDescription]').val();
        var stratDescription = $('form textarea[name=stratDescription]').val();

        //form validation logic
        if (!$("#expForm").valid()) {
            alert('Le questionnaire n\'est pas correctement complété!');
            return false
        }
        else {
            var difficulty = difficulties.val();
            var isRuleFound = foundOptions.val();
            var newData = {
                difficultyRating: difficulty,
                ruleFound: isRuleFound,
                descriptionOfRule: ruleDescription,
                descriptionOfStrategy: stratDescription
            }
            block.data[block.trial_idx] = $.extend({}, newData);
        }
        return true;
    }

    //simple exclusive-OR logic gate;
    function xor(x, y) {
        return (x || y) && !(x && y);
    }

    //sets the length of a phase of the categorization task, used to build the sequence of the experiment. if the number of trials cannot
    //be evenly divided among the pauses, this function returns the excess number of trials after the division, to be added to the length of last block
    function setPhaseLength(){
        var totalLength = expLength * 2 * stimRepeat;
        var excess = totalLength % (numberOfPauses + 1);
        legLength = Math.floor(totalLength/(numberOfPauses+1));
        return excess;
    }

    //assumes that stimPairs and the presentation order are correctly aligned
    function createCategorizationPresentationOrder() {
        var flatCopy = flatten(stimuliPairs);
        stimuliForCategorizationTask = flatCopy;
        for (var i = 1; i < stimRepeat; i++) {
            stimuliForCategorizationTask = stimuliForCategorizationTask.concat(flatCopy);
        }
        createKeyArray();
        dualShuffle(categorizationKey, stimuliForCategorizationTask);
    }


    this.getStim = function (canvas) {
        $.ajax({
            url: "ExperimentalSettings.php",
            type: "GET",
            dataType: "json",
            success: function (params) {
                var painter = new StimCreator(params, canvas);
                var finished = painter.loadAndGo();
                finished.done(function () {
                    var order = painter.getDistances();
                    var stimuliArray = painter.getStimuli();
                    var theZipFile = new JSZip();

                    //create the 4 folders for the 4 different types of pairs
                    var LL = theZipFile.folder("LL");
                    var KK = theZipFile.folder("KK");
                    var LK = theZipFile.folder("LK");
                    var KL = theZipFile.folder("KL");

                    var counter = 0;
                    var date = Date();
                    var zipOpts = { base64: true };

                    order.forEach(function (elem) {
                        var name = "pair" + counter + "-" + elem;
                        var code = elem.substring(0, 2);
                        var chosenFolder;
                        switch (code) {

                            case 'll':
                                chosenFolder = LL;
                                break;

                            case 'kk':
                                chosenFolder = KK;
                                break;

                            case 'lk':
                                chosenFolder = LK;
                                break;

                            case 'kl':
                                chosenFolder = KL;
                                break;

                            default:
                                throw "the request pair code did not start with a combination of the letters l and k!";
                                break;
                        }

                        chosenFolder.file(name + "A.png", stimuliArray[counter][0].split("data:image/png;base64,")[1], zipOpts);
                        chosenFolder.file(name + "B.png", stimuliArray[counter][1].split("data:image/png;base64,")[1], zipOpts);
                        counter++;
                    });

                    var content = theZipFile.generate({ type: 'blob' });
                    saveAs(content, "experimentalStimuli.zip");
                });
            }
        });
    };

    //the mother of all functions, launches the experiment
    this.launch = function (canvas, targetElement) {

        var doneBefore = true;
        var message = '';
        $.ajax({
            url: "cgi-bin/checkIfAlreadyDone.php",
            type: "GET",
            dataType: "json",
            success: function (report) {
                if (report['errormsg'] == "none") {
                    doneBefore = false;
                }
                else {
                    message = report['errormsg'];
                }

                if (doneBefore) {
                    alert(message);
                    window.location.href = "index.php";
                }
                else {
                    $.ajax({
                        url: "ExperimentalSettings.php",
                        type: "GET",
                        dataType: "json",
                        success: function (params) {

                            var $target = $(targetElement);
                            $target.html('').append("<p>" + get_lang("Création des stimuli, veuillez patienter", "Creating stimuli, please wait") + "</p>");
                            //first step: create the stimuli
                            var painter = new StimCreator(params, canvas);
                            //the loadAndGo function returns a Promise object, allowing us to continue only after completion of the function
                            //(when all stimuli are really created).

                            var progressBar = $("<div></div>");
                            $("#jsPsychTarget").prepend(progressBar);

                            progressBar.progressbar({
                                max: params.expLength
                            });

                            var stimuliCreated = painter.loadAndGo();
                            stimuliCreated.progress(function (n) {
                                progressBar.progressbar("value", n);
                            });

                            stimuliCreated.done(function () {
                                progressBar.progressbar("destroy");
                                $target.html('');
                                //load the settings from the object returned from the server
                                numberOfSimTrials = params.expLength
                                stimRepeat = params.stimRepeat;
                                numberOfPauses = params.numberOfPauses;
                                questionnaire = params.questionnaire;
                                similarityInstructions = params.similarityInstructions;
                                categorizationInstructions = params.categorizationInstructions;
                                actualSimTaskInstructions = params.actualSimTaskInstructions;
                                actualCatTaskInstructions = params.actualCatTaskInstructions;
                                sampleTableDimensions = params.sampleTableDimensions;
                                generalInstructions = params.generalInstructions;
                                outro = params.outro;
                                sampleSize = params.sampleSize;
                                stimDisplaySize = params.stimDisplaySize;
                                fixationCross = params.fixationCross;
                                catOptions = params.catOptions;
                                simOptions = params.simOptions;
                                sampleOptions = params.sampleOptions;
                                pauseOptions = params.pauseOptions;
                                startDate = params.startDate;
                                id = params.id;

                                //create a true copy of the param object (since, due to my poor code, it will get changed) so that we can send back
                                //the settings of this run to the server
                                var originalSettings = $.extend(true, {}, params);

                                //recuperate the stimuli from the painter object
                                stimuliPairs = painter.getStimuli();
                                presentationOrder = painter.getDistances();

                                //prepare the stimuli array for the categorization phase
                                createCategorizationPresentationOrder();

                                //Now we can start creating the block of the experiment, first we place the intro
                                generalInstructions.type = "text";
                                generalInstructions.text = generalInstructions[language];
                                theExperiment.push(generalInstructions);
                                //Now the stimuli samples
                                sampleOptions.type = "text";
                                sampleOptions.text = ["<p>" + sampleOptions[language] + "</p>" + self.generateSampleTable()];
                                theExperiment.push(sampleOptions);

                                //then the instruction block for the similarity judgment
                                similarityInstructions.type = "text";
                                similarityInstructions.text = similarityInstructions[language];
                                theExperiment.push(similarityInstructions);

                                //prepare the similarity task block
                                simOptions.type = "similarity";
                                simOptions.stimuli = stimuliPairs;
                                simOptions.labels = simOptions.labels[language];
                                simOptions.timeout_message = simOptions.timeout_message[language];
                                simOptions.fixation = fixationCross;

                                //But just before we add the real similiarity task, well add a practice block with the exact same settings
                                //(Just different stimuli)
                                var simPractice = $.extend(true, {}, simOptions);
                                simPractice.isPractice = true;
                                simPractice.stimuli = createArrayOfTrainingStimPaths(2);
                                theExperiment.push(simPractice);

                                //add a one page instruction block to tell participant the real similarity task is going to start
                                actualSimTaskInstructions.type = "text";
                                actualSimTaskInstructions.text = [actualSimTaskInstructions[language]];
                                theExperiment.push(actualSimTaskInstructions);
                                theExperiment.push(simOptions);

                                //Add the next instructions
                                categorizationInstructions.type = 'text';
                                categorizationInstructions.text = categorizationInstructions[language];
                                theExperiment.push(categorizationInstructions);

                                //training phase for categorization
                                catPractice = $.extend(true, {}, catOptions);
                                catPractice.stimuli = flatten(createArrayOfTrainingStimPaths(2));
                                catPractice.type = 'categorize';
                                catPractice.correct_text = catOptions.correct_text[language];
                                catPractice.incorrect_text = catOptions.incorrect_text[language];
                                catPractice.key_answer = (function () {
                                    var keys = [];
                                    var ans = 75;
                                    for (var a = 0; a < catPractice.stimuli.length; a++) {
                                        keys.push(ans);
                                        if (ans === 75) {
                                            ans = 76;
                                        }
                                        else {
                                            ans = 75;
                                        }
                                    }
                                    return keys;
                                })();
                                catPractice.timeout_message = catOptions.timeout_message[language];
                                catPractice.fixation = fixationCross;
                                catPractice.isPractice = true;
                                theExperiment.push(catPractice);

                                //Now the brief instruction block to tell participant that the real task is about to begin
                                actualCatTaskInstructions.type = "text";
                                actualCatTaskInstructions.text = [actualCatTaskInstructions[language]];
                                theExperiment.push(actualCatTaskInstructions);

                                //We want to pass the distances array to jsPsych so it can easily be used to record the type of each trial in the final data
                                //So we must do a little reformatting
                                var dataToBePassed = [];
                                for (var a = 0; a < presentationOrder.length; a++) {
                                    var subtype;
                                    var vectorialDistance = parseInt(presentationOrder[a].slice(2, presentationOrder[a].length));
                                    if (presentationOrder[a].charAt(0) == presentationOrder[a].charAt(1)) {
                                        subtype = "same";
                                    }
                                    else {
                                        subtype = "different";
                                    }
                                    dataToBePassed.push({ "subtype": subtype, "distance": vectorialDistance });
                                }
                                simOptions.data = dataToBePassed;

                                //finally the various categorization blocks interspersed with questionnaire/pause blocks
                                legLength = Math.floor(stimuliForCategorizationTask.length / (numberOfPauses + 1));
                                if (legLength < 1) { throw "really? this many pauses?"; }
                                var cutter = 0;
                                var escape = 0;
                                for (var i = 0; i < numberOfPauses + 1; i++) {

                                    //we clone the options object to use the copy as a block object
                                    var categorizationLeg = $.extend(true, {}, catOptions);
                                    categorizationLeg.type = "categorize";
                                    categorizationLeg.correct_text = catOptions.correct_text[language];
                                    categorizationLeg.incorrect_text = catOptions.incorrect_text[language];

                                    //if we are about to create the last block, take every stimuli from the cursor to the end
                                    if (i === numberOfPauses) {
                                        categorizationLeg.stimuli = stimuliForCategorizationTask.slice(cutter, stimuliForCategorizationTask.length);
                                        categorizationLeg.key_answer = categorizationKey.slice(cutter, categorizationKey.length);
                                    }
                                    //else we take the next calculated number of stimuli
                                    else {
                                        categorizationLeg.stimuli = stimuliForCategorizationTask.slice(cutter, cutter + legLength);
                                        categorizationLeg.key_answer = categorizationKey.slice(cutter, cutter + legLength);
                                    }
                                    cutter += legLength;

                                    categorizationLeg.timeout_message = catOptions.timeout_message[language];
                                    categorizationLeg.fixation = fixationCross;
                                    theExperiment.push(categorizationLeg);

                                    //now we follow with a questionnaire/pause block
                                    if (escape < numberOfPauses) {
                                        var miniSurvey = $.extend({}, pauseOptions);
                                        miniSurvey.cont_btn = 'questionnaire';
                                        miniSurvey.pages = [{
                                            url: pauseOptions[language],
                                            check_fn: function () {
                                                return $("#expForm").valid();
                                            }
                                        }];
                                        theExperiment.push(miniSurvey);
                                    }

                                    escape++;
                                }

                                //We now append the repeat of the similarity judgment task, but first a quick re introduction
                                var reIntroduction = $.extend({}, params.reprise);
                                reIntroduction.type = "text";
                                reIntroduction.text = [params.reprise[language]];
                                theExperiment.push(reIntroduction);
                                theExperiment.push(simOptions);

                                outro.type = "text";
                                outro.text = outro[language];
                                outro.timeout = 10000;
                                theExperiment.push(outro);

                                //finally, preload the stims and launch jsPsych
                                jsPsych.preloadImages([fixationCross]);
                                jsPsych.preloadImages(stimuliPairs.concat(flatten(createArrayOfTrainingStimPaths(10))), function () {
                                    $(targetElement).css('min-height', '500px');
                                    jsPsych.init({
                                        display_element: $(targetElement),
                                        experiment_structure: theExperiment,
                                        maxTotalTimeouts: params.maxTotalTimeouts,
                                        maxConsecutiveTimeouts: params.maxConsecutiveTimeouts,
                                        informProgress: function (info) {
                                            $('#retroaction').html("<p>" + get_lang("Réponses correctes: ", "Correct Answers: ") + info + "</p><p>" + (info * 0.1).toFixed(2) + "$</p>");
                                        },
                                        on_finish: function (data) {
                                            var results = jsPsych.data();
                                            /*
                                            for (var k = 0; k < results.length; k++) {
                                            results[k].id = id;
                                            }
                                            */
                                            results.push({
                                                type: "global",
                                                serverStartTime: startDate,
                                                completionTime: jsPsych.totalTime() / (60 * 1000),
                                                participant: id,
                                                browser: navigator.sayswho,
                                                difficulty: params.difficulty,
                                                num_att: params.attNumber,
                                                density: params.side,
                                                lang: language,
                                                definitions: painter.getInvariants(),
                                                settings: originalSettings,
                                                correctAnswers: jsPsych.getCounter()
                                            });
                                            results = JSON.stringify(results);
                                            writeData(results);
                                        }
                                    });
                                });
                            }); //Look at all those pretty callbacks :)
                        }
                    });
                }
            }
        });



        
    }

	function writeData(results){
	    console.log(results);
	    $.ajax({
	        url: "cgi-bin/writeData.php",
	        type: "POST",
	        data: {
	            results: results
	        }/*,
            //This is just to make sure the page sends the correct json, delete for publishing
            
	        success: function () {
	            $(targetElement).html(results);
	        }
            */
	    });
	}

	//stackoverflow answer to detect browser version. god knows how this works
	navigator.sayswho= (function(){
		var ua= navigator.userAgent, tem, 
		M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
		if(/trident/i.test(M[1])){
			tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
			return 'IE '+(tem[1] || '');
		}
		if(M[1]=== 'Chrome'){
			tem= ua.match(/\bOPR\/(\d+)/)
			if(tem!= null) return 'Opera '+tem[1];
		}
		M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
		if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
		return M.join(' ');
		})();

    function shuffle(o){
		for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
    }

    function createArrayOfTrainingStimPaths(length){
      var paths=[];
      var currentPath = "media/StimuliTraining/";
      for(var n=0; n<length; n++){
          var pair = [];
          pair.push(currentPath + "1/" + n.toString() + ".png");
          pair.push(currentPath + "2/" + n.toString() + ".png");
          paths.push(pair);
      }
      return paths;  
    };
}
