/** (July 2012, Erik Weitnauer)
The html-plugin will load and display an arbitrary number of html pages. To proceed to the next, the
user might either press a button on the page or a specific key. Afterwards, the page get hidden and
the plugin will wait of a specified time before it proceeds.

documentation: https://github.com/jodeleeuw/jsPsych/wiki/jspsych-html
*/
(function ($) {
    jsPsych.html = (function () {

        var plugin = {};

        plugin.create = function (params) {

            params = jsPsych.pluginAPI.enforceArray(params, ['pages']);

            var trials = [];


            for (var i = 0; i < params.pages.length; i++) {
                trials.push({
                    type: "html",
                    url: params.pages[i].url,
                    cont_key: params.pages[i].cont_key || params.cont_key,
                    cont_btn: params.pages[i].cont_btn || params.cont_btn,
                    timing_post_trial: params.pages[i].timing_post_trial || (typeof params.timing_post_trial === 'undefined') ? 1000 : params.timing_post_trial,
                    check_fn: params.pages[i].check_fn,
                    data: {},
                    force_refresh: (typeof params.force_refresh === 'undefined') ? false : params.force_refresh,
                    timeout: params.pages[i].timeout || params.timeout,
                    isPractice: params.isPractice || false
                });
            }
            return trials;
        };

        plugin.trial = function (display_element, block, trial, part) {

            // if any trial variables are functions
            // this evaluates the function and replaces
            // it with the output of the function
            trial = jsPsych.pluginAPI.normalizeTrialVariables(trial, ["check_fn"]);

            var url = trial.url;
            if (trial.force_refresh) {
                url = trial.url + "?time=" + (new Date().getTime());
            }

            //displays the HTML element
            display_element.load(trial.url, function () {
                var t0 = (new Date()).getTime();
                //handle for the timeout
                var limiter;

                //if a timeout is specified, set it using the previously defined handle
                if (trial.timeout > 0) {
                    limiter = setTimeout(finish, trial.timeout);
                }

                var finish = function () {
                    //clear the handle of the timeout since we may have executed finish() from another event and we dont want it repeated
                    clearTimeout(limiter);


                    if (trial.check_fn && !trial.check_fn(display_element, block)) return;
                    if (trial.cont_key) $(document).unbind('keydown', key_listener);
                    var trial_data = {
                        trial_type: "html",
                        trial_index: block.trial_idx,
                        rt: (new Date()).getTime() - t0,
                        url: trial.url,
                        isPractice: trial.isPractice
                    };

                    // check if the check_fn function already created a data object in the block.data array
                    if (typeof block.data[block.trial_idx] === 'undefined') {
                        //if it didnt, then create an data object from scratch and add it
                        block.data[block.trial_idx] = $.extend({}, trial_data);
                    }
                    else {
                        //if it didn't, then extend WITHOUT overwriting
                        $.extend(block.data[block.trial_idx], trial_data);
                    }

                    if (trial.timing_post_trial > 0) {
                        // hide display_element, since it could have a border and we want a blank screen during timing
                        display_element.hide();
                        setTimeout(function () {
                            display_element.empty();
                            display_element.show();
                            block.next();
                        }, trial.timing);
                    }
                    else {
                        display_element.empty();
                        block.next();
                    }
                };
                if (trial.cont_btn) $('#' + trial.cont_btn).click(finish);
                if (trial.cont_key) {
                    var key_listener = function (e) {
                        if (e.which == trial.cont_key) finish();
                    };
                    $(document).keydown(key_listener);
                }
            });
        };

        return plugin;
    })();
})(jQuery);
