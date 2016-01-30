$(function () {


    //preload the little spinner
    var spinner = document.createElement('img');
    spinner.src = "style/stimCreationLoader.gif";



    $.fn.clicktoggle = function (a, b) {
        return this.each(function () {
            var clicked = false;
            $(this).click(function () {
                if (clicked) {
                    clicked = false;
                    return b.apply(this, arguments);
                }
                clicked = true;
                return a.apply(this, arguments);
            });
        });
    };

    function letsGo(pageText, target, paintingArea) {
        var toKill = document.getElementById(pageText);
        toKill.parentNode.removeChild(toKill);
        var experience = new ExperimentManager(target);
        experience.launch(paintingArea, target);
    }

    $("#start").click(function (e) {
        if (document.getElementById("accept").checked) {
            var top = document.getElementById("top").offsetTop;
            window.scrollTo(0, top);
            var theCanvas = document.getElementById("stimCanvas");
            letsGo("instructionsUp", "#jsPsychTarget", theCanvas);
            $('#start').remove();
        }
        else {
            alert("veuillez cocher la case J'accepte / Please check the box I Accept");
        }

    });

    $("span.expand").html("[+] ");
    $(".entryBody").hide();


    $("h4.entryTitle").clicktoggle(function () {
        $(this).next(".entryBody").slideDown();
        $(this).children(".expand").html("[-] ");
    }, function () {
        $(this).next(".entryBody").slideUp();
        $(this).children(".expand").html("[+] ");
    });

    //global (i know...) variable keeping track of whether this is the first time the ques
    var isFirstQuestionnaire = true;

    $("#dldstim").click(function () {
        var experiment = new ExperimentManager("#jsPsycTarget");
        experiment.getStim(document.getElementById("stimCanvas"));
    });

});