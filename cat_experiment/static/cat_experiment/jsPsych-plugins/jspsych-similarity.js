/** 
 * jspsych-similarity.js
 * Josh de Leeuw
 * 
 * This plugin create a trial where two images are shown sequentially, and the subject rates their similarity using a slider controlled with the mouse.
 *
 * documentation: https://github.com/jodeleeuw/jsPsych/wiki/jspsych-similarity
 * 
 */

(function ($) {
    jsPsych.similarity = (function () {

        var plugin = {};

        plugin.create = function (params) {

            jsPsych.pluginAPI.enforceArray(params, ['data']);

            var trials = new Array(params.stimuli.length);
            for (var i = 0; i < trials.length; i++) {
                trials[i] = {};
                trials[i].type = "similarity";
                trials[i].a_path = params.stimuli[i][0];
                trials[i].b_path = params.stimuli[i][1];
                trials[i].labels = (typeof params.labels === 'undefined') ? ["Not at all similar", "Identical"] : params.labels;
                trials[i].intervals = params.intervals || 100;
                trials[i].show_ticks = (typeof params.show_ticks === 'undefined') ? false : params.show_ticks;

                trials[i].show_response = params.show_response || "SECOND_STIMULUS";

                trials[i].timing_first_stim = params.timing_first_stim || 1000; // default 1000ms
                trials[i].timing_second_stim = params.timing_second_stim || -1; // -1 = inf time; positive numbers = msec to display second image.
                trials[i].timing_image_gap = params.timing_image_gap || 1000; // default 1000ms
                trials[i].timing_post_trial = (typeof params.timing_post_trial === 'undefined') ? 1000 : params.timing_post_trial; // default 1000ms

                trials[i].is_html = (typeof params.is_html === 'undefined') ? false : params.is_html;
                trials[i].prompt = (typeof params.prompt === 'undefined') ? '' : params.prompt;
                trials[i].data = (typeof params.data === 'undefined') ? {} : params.data[i];
                trials[i].timeout = params.timeout || -1;
                trials[i].timeout_message = (typeof params.timeout_message === 'undefined') ? '' : params.timeout_message;
                trials[i].timing_timeout = params.timing_timeout || 1000;
                trials[i].fixation = (typeof params.fixation === 'undefined') ? '' : params.fixation;
                trials[i].timing_fixation = params.timing_fixation || -1;
                trials[i].isPractice = params.isPractice || false;
            }
            return trials;
        };

        var sim_trial_complete = false;

        var interTrialGap = 0;
        var hide2ndStim = 0;
        var show2ndStim = 0;

        plugin.trial = function (display_element, block, trial, part) {

            // if any trial variables are functions
            // this evaluates the function and replaces
            // it with the output of the function
            trial = jsPsych.pluginAPI.normalizeTrialVariables(trial);

            switch (part) {
                case 1:

                    sim_trial_complete = false;
                    // show the images

                    //fixation cross feature
                    if (trial.timing_fixation > 0) {
                        display_element.append($('<img>', {
                            'src': trial.fixation,
                            'id': 'fixationCross'
                        }));
                        setTimeout(function () {
                            firstPhase();
                        }, trial.timing_fixation);
                    }
                    else {
                        firstPhase();
                    }

                    function firstPhase() {
                        display_element.html('');
                        if (!trial.is_html) {
                            display_element.append($('<img>', {
                                "src": trial.a_path,
                                "id": 'jspsych_sim_stim'
                            }));
                        }
                        else {
                            display_element.append($('<div>', {
                                "html": trial.a_path,
                                "id": 'jspsych_sim_stim'
                            }));
                        }

                        //alert('trying to show first stim '+$('#jspsych_sim_stim').css('visibility'));

                        if (trial.show_response == "FIRST_STIMULUS") {
                            show_response_slider(display_element, trial, block);
                        }

                        interTrialGap = setTimeout(function () {
                            plugin.trial(display_element, block, trial, part + 1);
                        }, trial.timing_first_stim);
                    }

                    break;

                case 2:
                    //alert('interstimgap');
                    $('#jspsych_sim_stim').css('visibility', 'hidden');
                    if (!trial.is_html) {
                        $('#jspsych_sim_stim').attr('src', trial.b_path);
                    }
                    else {
                        $('#jspsych_sim_stim').html(trial.b_path);
                    }
                    show2ndStim = setTimeout(function () {
                        plugin.trial(display_element, block, trial, part + 1);
                    }, trial.timing_image_gap);
                    break;

                case 3:
                    //alert('trying to show second stim');


                    $('#jspsych_sim_stim').css('visibility', 'visible');

                    if (trial.show_response == "SECOND_STIMULUS") {
                        show_response_slider(display_element, trial, block);
                    }

                    if (trial.timing_second_stim > 0) {
                        hide2ndStim = setTimeout(function () {
                            if (!sim_trial_complete) {
                                $("#jspsych_sim_stim").css('visibility', 'hidden');
                                if (trial.show_response == "POST_STIMULUS") {
                                    show_response_slider(display_element, trial, block);
                                }
                            }
                        }, trial.timing_second_stim);
                    }

                    break;
            }
        };

        function show_response_slider(display_element, trial, block) {
            //
            var startTime = (new Date()).getTime();

            // create slider
            display_element.append($('<div>', {
                "id": 'slider',
                "class": 'sim'
            }));

            $("#slider").slider({
                value: 0,
                min: 1,
                max: trial.intervals,
                step: 1
            });
            //set the starting position of the slider handle as the same as the mouse
            
            // show tick marks
            if (trial.show_ticks) {
                for (var j = 1; j < trial.intervals - 1; j++) {
                    $('#slider').append('<div class="slidertickmark"></div>');
                }

                $('#slider .slidertickmark').each(function (index) {
                    var left = (index + 1) * (100 / (trial.intervals - 1));
                    $(this).css({
                        'position': 'absolute',
                        'left': left + '%',
                        'width': '1px',
                        'height': '100%',
                        'background-color': '#222222'
                    });
                });
            }

            // create labels for slider
            display_element.append($('<ul>', {
                "id": "sliderlabels",
                "class": 'sliderlabels',
                "css": {
                    "width": "100%",
                    "height": "3em",
                    "margin": "10px 0px 0px 0px",
                    "padding": "0px",
                    "display": "block",
                    "position": "relative"
                }
            }));

            for (var j = 0; j < trial.labels.length; j++) {
                $("#sliderlabels").append('<li>' + trial.labels[j] + '</li>');
            }

            // position labels to match slider intervals
            var slider_width = $("#slider").width();
            var num_items = trial.labels.length;
            var item_width = slider_width / num_items;
            var spacing_interval = slider_width / (num_items - 1);

            $("#sliderlabels li").each(function (index) {
                $(this).css({
                    'display': 'inline-block',
                    'width': item_width + 'px',
                    'margin': '0px',
                    'padding': '0px',
                    'text-align': 'center',
                    'position': 'absolute',
                    'left': (spacing_interval * index) - (item_width / 2)
                });
            });

            /*
            //  create button
            display_element.append($('<button>', {
            'id': 'next',
            'class': 'sim',
            'html': 'Submit Answer'
            }));
            */

            // if prompt is set, show prompt
            if (trial.prompt !== "") {
                display_element.append(trial.prompt);
            }


            //code to make the slider handle follow the x position of the mouse when it moves in the jsPsych target area


            //First find out the limits of the range of the slider, so we dont move the handle outside the slider
            var sliderLimitLeft = 0;
            var sliderLimitRight = sliderLimitLeft + $('#slider').width();
            var sliderHandle = $("span.ui-slider-handle");
            var theSlider = $('#slider');
            var rightLimit = theSlider.offset().left+theSlider.width();
            $('#jsPsychTarget').mousemove(function (e) {
                //First get the position of the mouse relative to the top left corner of the screen
                var mouseX = e.pageX;
                if (mouseX <= theSlider.offset().left + theSlider.width() && mouseX >= theSlider.offset().left) {
                    sliderHandle.css("left", mouseX - theSlider.offset().left);
                }

            });
            
            $(".ui-slider-handle").offset({
                top: $(".ui-slider-handle").offset().top,
                left: (jsPsych.getMousePos().x>rightLimit) ? rightLimit : (jsPsych.getMousePos().x < theSlider.offset().left)? theSlider.offset().left : jsPsych.getMousePos().x 
            });

            $('body, span.ui-slider-handle').click(function (e) {
                e.stopPropagation();
                endTrial(false);
            });
            //Now we want to stop this "following" behavior of the handle to stop on a click, and to resume on the next click
            //CAUTION this code relies on the function clicktoggle(fn1, fn2) being added to the jQuery object prototype. it will fail if not done previously


            /*
            $('body, span.ui-slider-handle').clicktoggle(function () {
            $('#jsPsychTarget').unbind("mousemove");
            }, function (e) {
                
            $('#jsPsychTarget').mousemove(function (e) {
                    
            var mouseX = e.pageX;
            if (mouseX <= $('#slider').position().left + $('#slider').width() && mouseX >= $('#slider').position().left) {
            $('span.ui-slider-handle').css("left", mouseX - $('#slider').position().left);
            }
            })
            });
            */

            var timeoutHandle;
            //If a time limit was specified, start counting now
            if (trial.timeout > 0) {
                timeoutHandle = setTimeout(function () {
                    endTrial(true);
                }, trial.timeout);
            }

            //I realized making the handle follow cursor position was easy but since the moving of the handle did not go throught the jquery-ui API,
            //its position value does not get updated, so we cannot use the jquery.slider functions to get a similarity score (its as if moving the handle div directly
            //did not count, you have to use jquery.slider functions). Fixing this would mean spending hours learning how the jquery.ui library works as a whole and uses
            //mouse events, then modifying the code so that mousemove events are like regular click and drag events. way too long. instead i chose to forgo
            //using the slider API and just calculate a score using screen positions. It doesnt matter since we dont need most of the slider API anyway.
            function getSimScore() {
                //find the left property of the handle
                var distanceFromStart = $(".ui-slider-handle").position().left;
                var totalWidth = $("#slider").width();
                return limitDecimals(distanceFromStart / totalWidth, 2) * 100;
            }

            //Clever little function to return an actual float with a limited decimal expansion
            function limitDecimals(number, limit) {
                return Math.floor(number * Math.pow(10, limit)) / Math.pow(10, limit);
            }

            /**
            *	Computes reaction time, ends the trial, writes data 
            *	optionally presents an inter trial screen, and starts the next trial.
            *	If the trial ended due to a time out, presents the timeout_message before
            *	going to the next trial and writes a special value as the score 
            *	
            *
            *	@param late	indicates whether to end the trial due to a time out
            *				set as true only if trial.timeout > 0 
            */
            function endTrial(late) {
                //alert('ending trial!');
                //disable previously scheduled calls
                clearTimeout(timeoutHandle);
                clearTimeout(interTrialGap);
                clearTimeout(show2ndStim);
                clearTimeout(hide2ndStim);
                $('body').unbind("click");
                $('#jsPsychTarget').unbind("click").unbind("mousemove");

                //$('body, span.ui-slider-handle').unbind('click');
                var endTime = (new Date()).getTime();
                var response_time = endTime - startTime;
                sim_trial_complete = true;
                var score = 0;

                if (!late) {
                    score = getSimScore();
                }
                else {
                    score = -1;
                }

                var currentProgress = jsPsych.progress.current_trial_local;
                var currentType =

				block.writeData($.extend({}, {
				    "sim_score": score,
				    "rt": response_time,
				    //"stimulus": trial.a_path,
				    //"stimulus_2": trial.b_path,
				    "trial_type": "similarity",
				    "trial_index": block.trial_idx,
				    "isPractice": trial.isPractice
				}, trial.data));

                // goto next trial in block
                if (!late) {
                    block.allIsFine();
                    display_element.html('');
                    if (trial.timing_post_trial > 0) {
                        setTimeout(function () {
                            block.next();
                        }, trial.timing_post_trial);
                    }
                    else {
                        block.next();
                    }
                }
                else if (trial.timeout > 0) {
                    block.timedOut();
                    display_element.html(trial.timeout_message);
                    setTimeout(function () {
                        display_element.html('');
                        if (trial.timing_post_trial > 0) {
                            setTimeout(function () {
                                block.next();
                            }, trial.timing_post_trial);
                        }
                        else {
                            block.next();
                        }
                    }, trial.timing_timeout);
                }
            }

            /*
            $("#next").click(function (e) {
            clearTimeout(timeoutHandle);
            e.stopPropagation();
            endTrial(false);
            });
            */
        }

        return plugin;
    })();
})(jQuery);
