"use strict";

function getAndPopulateTrustGraph(member, target) {

    var page = 'trustgraphdetails';
    //First clear old graph
    document.getElementById('trustgraph').innerHTML = trustgraphHTML;
    document.getElementById(page).innerHTML = document.getElementById("loading").innerHTML;


    let theURL = dropdowns.contentserver + '?action=trustgraph&address=' + member + '&qaddress=' + target;
    getJSON(theURL).then(async function (data) {

        if(data[0]){
            setPageTitleRaw("@" + data[0].targetpagingid);
        } else {
            document.getElementById('trustgraphdetails').innerHTML = "No information on this right now.";
            return;
        }

        var directrating = 0.0;
        var oneRemoveRating = 0.0;
        var oneRemoveRatingCount = 0.0;
        var overallRating = 0.0;


        var contentsHTML = "";

        for (var i = 0; i < data.length; i++) {
            if (i == 0 && data[i].inter == '') {
                //Direct Rating
                contentsHTML += getDirectRatingHTML(data[i]);
                directrating = Number(data[i].memberrating);
            } else {
                contentsHTML += getIndirectRatingHTML(data[i]);
                //Try to get at least 10 ratings, or all the ratings if they are not follow based ratings 
                //if ((i < 10 && Number(data[i].memberrating) > 190) || Number(data[i].memberrating) > 191) {
                oneRemoveRating += Number(data[i].interrating);
                oneRemoveRatingCount++;
                //}
            }
        }


        //alert(contents);

        var oneRemove = 0.0;
        if (oneRemoveRatingCount > 0) {
            oneRemove = oneRemoveRating / oneRemoveRatingCount;
        }

        if (directrating > 0 && oneRemoveRatingCount > 0) {
            overallRating = (directrating + oneRemove) / 2;
        } else if (directrating > 0 && oneRemoveRatingCount == 0) {
            overallRating = directrating;
        } else if (directrating == 0 && oneRemoveRatingCount > 0) {
            overallRating = oneRemove;
        }

        overallRating = (overallRating / 64) + 1;

        if (oneRemoveRatingCount == 0) {
            overallRating = 0;
        }

        contentsHTML = getTrustRatingTableHTML(contentsHTML, overallRating.toFixed(1));

        document.getElementById(page).innerHTML = contentsHTML;


        if (!cytoscape) { await loadScript("js/lib/cytoscape3.19.patched.min.js"); }

        var cy = cytoscape({
            container: document.getElementById('cy'),

            boxSelectionEnabled: false,
            autounselectify: true,


            style: cytoscape.stylesheet()
                .selector('node')
                .css({
                    'label': 'data(label)',
                    'height': 80,
                    'width': 80,
                    'background-fit': 'cover',
                    'border-color': '#000',
                    'border-width': 3,
                    'border-opacity': 0.75,
                    'text-margin-y': 5,
                    'color': '#999',
                })
                .selector('.bottom-center')
                .css({
                    "text-valign": "bottom",
                    "text-halign": "center"
                })
                .selector('.eater')
                .css({
                    'border-width': 9
                })
                .selector('edge')
                .css({
                    'curve-style': 'bezier',
                    'width': 6,
                    'target-arrow-shape': 'triangle',
                    'line-color': '#ffaaaa',
                    'target-arrow-color': '#ffaaaa'
                })
        }); // cy init

        var eles = cy.add([{ group: 'nodes', data: { id: data[0].target, label: data[0].targetname, textnote: data[0].targetname }, classes: 'bottom-center ', position: { x: 0, y: 0 } },]);
        cy.add(eles);
        cy.style().selector('#' + data[0].member).css({ 'background-image': getPicURL(data[0].memberpicurl, profilepicbase, data[0].member) });
        cy.style().selector('#' + data[0].target).css({ 'background-image': getPicURL(data[0].targetpicurl, profilepicbase, data[0].target) });


        var items = data.length;
        for (var i = 0; i < items; i++) {

            var position = i;
            if (i % 2 == 1) {
                position = (i + 1) / 2;
            } else {
                position = items - (i / 2);
            }

            var x = -250 * Math.sin(2 * Math.PI * position / items);
            var y = -250 * Math.cos(2 * Math.PI * position / items);

            var theRating = outOfFive(data[i].memberrating);
            var theRating2 = outOfFive(data[i].interrating);

            var textNoteNode = data[i].membername + ' ' + getSafeTranslation('rates', 'rates') + ' ' + rts(data[i].intername) + ' ' + theRating + '/5 (' + data[i].memberreason + ')';
            var textNoteEdge = data[i].intername + ' ' + getSafeTranslation('rates', 'rates') + ' ' + rts(data[i].targetname) + ' ' + theRating2 + '/5 (' + data[i].interreason + ')';


            var eles = cy.add([


                { group: 'nodes', data: { label: data[i].intername, id: data[i].inter, textnote: textNoteNode }, classes: 'bottom-center', position: { x: x, y: y } },
                /*{ group: 'edges', data: { id: data[i].member+data[i].inter, source: data[i].member, target: data[i].inter }, classes: edgecolorsize1 },*/
                { group: 'edges', data: { id: data[i].inter + data[i].target, source: data[i].inter, target: data[i].target, textnote: textNoteEdge } }

            ]);
            cy.add(eles);

            cy.style().selector('#' + data[i].inter).css({ 'background-image': getPicURL(data[i].interpicurl, profilepicbase, data[i].inter) });

            let theRatingAbs = Math.abs(theRating2 - 3);
            let linecolor = 'rgb(' + (214 - 98 * theRatingAbs) + ',' + (244 - 60 * theRatingAbs) + ',' + (255 - 35 * theRatingAbs) + ')';
            if (theRating2 < 3) { linecolor = 'rgb(242,' + (228 - 92 * theRatingAbs) + ',' + (228 - 97 * theRatingAbs) + ')'; }
            cy.style().selector('#' + data[i].inter + data[i].target).css({ 'width': (4 + theRatingAbs * 8), 'line-color': linecolor, 'target-arrow-color': linecolor });

            theRatingAbs = Math.abs(theRating - 3);
            linecolor = 'rgb(' + (214 - 98 * theRatingAbs) + ',' + (244 - 60 * theRatingAbs) + ',' + (255 - 35 * theRatingAbs) + ')';
            if (theRating < 3) { linecolor = 'rgb(242,' + (228 - 92 * theRatingAbs) + ',' + (228 - 97 * theRatingAbs) + ')'; }
            cy.style().selector('#' + data[i].inter).css({ 'border-width': (4 + theRatingAbs * 4), 'border-color': linecolor });

            //'width': 12,
            //'line-color': '#61aff0',
            //'target-arrow-color': '#61aff0',

            //cy.data(data[i].inter,data[i].intername);
        }

        cy.userZoomingEnabled(false);
        cy.center();
        cy.fit();

        cy.on('tap', 'node', function () {
            if(this.data('membertxid')){
                window.location.href = "#thread?root=" + this.data('membertxid');
            }
            //window.location.href = "#rep?qaddress=" + this.data('id');
            //must add txid of rating to db first before can enable this
        });

        cy.on('tap', 'node', function () {
            window.location.href = "#rep?qaddress=" + this.data('id');
        });

        cy.on('mouseover', 'node', function (event) {
            document.getElementById('cynote').textContent = this.data('textnote');
        });

        cy.on('mouseover', 'edge', function (event) {
            document.getElementById('cynote').textContent = this.data('textnote');
        });


        var overallStarRating = raterJs({
            starSize: 48,
            rating: Math.round(overallRating * 10) / 10,
            element: document.querySelector("#overall"),
            //rateCallback: function rateCallback(rating, done) {
            //rateCallbackAction(rating, this);
            //    done();
            //}
        });
        overallStarRating.disable();

        for (var i = 0; i < data.length; i++) {
            if (i == 0 && data[i].inter == '') {
                var rawRating = Number(data[i].memberrating);
                var textNote = "";
                var theRating = (rawRating / 64) + 1;
                var starRating1 = raterJs({
                    starSize: 24,
                    rating: Math.round(theRating * 10) / 10,
                    element: document.querySelector("#trust" + san(data[i].member) + san(data[i].target)),
                    disableText: rts(data[i].membername) + ' ' + getSafeTranslation('rates', 'rates') + ' ' + rts(data[i].targetname) + ' {rating}/{maxRating}' + textNote,
                });
                starRating1.disable();

            } else {

                var theRating = (Number(data[i].memberrating) / 64) + 1;
                var rawRating = Number(data[i].memberrating);
                var textNote = "";
                textNote = data[i].memberreason;
                var starRating1 = raterJs({
                    starSize: 18,
                    rating: Math.round(theRating * 10) / 10,
                    element: document.querySelector("#trust" + san(data[i].member) + san(data[i].inter)),
                    disableText: rts(data[i].membername) + ' ' + getSafeTranslation('rates', 'rates') + ' ' + rts(data[i].intername) + ' {rating}/{maxRating} (' + textNote + ')',
                });
                starRating1.disable();

                var theRating2 = (Number(data[i].interrating) / 64) + 1;
                var rawRating = Number(data[i].interrating);
                var textNote2 = "";
                textNote2 = data[i].interreason;

                var starRating2 = raterJs({
                    starSize: 18,
                    rating: Math.round(theRating2 * 10) / 10,
                    element: document.querySelector("#trust" + san(data[i].inter) + san(data[i].target)),
                    disableText: rts(data[i].intername) + ' ' + getSafeTranslation('rates', 'rates') + ' ' + rts(data[i].targetname) + ' {rating}/{maxRating} (' + textNote2 + ')',
                });
                starRating2.disable();
            }

        }

        addDynamicHTMLElements();

    }, function (status) { //error detection....
        showErrorMessage(status, page, theURL);
    });

}

function getAndPopulateBesties(target) {

    var page = 'besties';
    //First clear old graph

    document.getElementById('besties').innerHTML = document.getElementById("loading").innerHTML;


    let theURL = dropdowns.contentserver + '?action=support&address=' + pubkey + '&qaddress=' + target;
    getJSON(theURL).then(async function (data) {

        if (data[0]) {
            setPageTitleRaw("@" + data[0].pagingid);
        } else {
            document.getElementById('besties').innerHTML = "No information on this right now.";
            return;
        }

        document.getElementById('besties').innerHTML = bestiesHTML;
        if (!cytoscape) { await loadScript("js/lib/cytoscape3.19.patched.min.js"); }

        var cy = cytoscape({
            container: document.getElementById('bestiescy'),

            boxSelectionEnabled: false,
            autounselectify: true,


            style: cytoscape.stylesheet()
                .selector('node')
                .css({
                    'label': 'data(label)',
                    'height': 80,
                    'width': 80,
                    'background-fit': 'cover',
                    'border-color': '#000',
                    'border-width': 3,
                    'border-opacity': 0.75,
                    'text-margin-y': 5,
                    'color': '#999',
                })
                .selector('.bottom-center')
                .css({
                    "text-valign": "bottom",
                    "text-halign": "center"
                })
                .selector('.eater')
                .css({
                    'border-width': 9
                })
                .selector('edge')
                .css({
                    'curve-style': 'bezier',
                    'width': 6,
                    'target-arrow-shape': 'triangle',
                    'line-color': 'rgb(71,137,75)',
                    'target-arrow-color': 'rgb(71,137,75)'
                })
        }); // cy init

        var eles = cy.add([{ group: 'nodes', data: { id: data[0].address, label: data[0].name, textnote: data[0].name }, classes: 'bottom-center ', position: { x: 0, y: 0 } },]);
        cy.add(eles);
        cy.style().selector('#' + data[0].address).css({ 'background-image': getPicURL(data[0].picurl, profilepicbase, data[0].address), 'height': 160, 'width': 160, });


        var items = data.length;

        var max = Number(data[1].totalconnection);
        var min = Number(data[data.length - 1].totalconnection);
        var min = 0;
        var spread = max - min;

        for (var i = 1; i < items; i++) {


            var position = i;
            if (position % 2 == 1) {
                position = (position + 1) / 2;
            } else {
                position = items - (position / 2);
            }

            let distance = -250;
            var x = distance * Math.sin(2 * Math.PI * position / items);
            var y = distance * Math.cos(2 * Math.PI * position / items);

            //var theRating = outOfFive(data[i].memberrating);
            //var theRating2 = outOfFive(data[i].interrating);
            //var textNoteNode = data[i].membername + ' ' + getSafeTranslation('rates', 'rates') + ' ' + rts(data[i].intername) + ' ' + theRating + '/5 (' + data[i].memberreason + ')';
            //var textNoteEdge = data[i].intername + ' ' + getSafeTranslation('rates', 'rates') + ' ' + rts(data[i].targetname) + ' ' + theRating2 + '/5 (' + data[i].interreason + ')';

            //let size=(Number(data[i].totalconnection)-min)/spread;

            let valreceived = (Number(data[i].weightedpointsfromreposts) * 5 + Number(data[i].likevaluereceivedonposts));
            let valgiven = (Number(data[i].weightedpointstoreposts) * 5 + Number(data[i].likevaluegiventoposts));

            /*
            let ratio;            
            let baseRatio=valgiven/valreceived;
            if(valgiven>valreceived){
                baseRatio=valgiven/valreceived;
            }else{
                baseRatio=valreceived/valgiven;
            }*/
            //ratio=Math.min(baseRatio,12);

            //let totalsupportgiven= (data[i].likevaluegiventoposts + data[i].likevaluegiventoreplies/5 + data[i].weightedpointstoreposts*5);
            //let totalsupportreceived= (data[i].likevaluereceivedonposts + data[i].likevaluereceivedonreplies/5 + data[i].weightedpointsfromreposts*5);

            let textNote1 = `Support Received:${(valreceived / 1000000).toFixed(0)}`;
            let textNote2 = `Support Given:${(valgiven / 1000000).toFixed(0)}`;
            //var eles = cy.add([{ group: 'nodes', data: { id: data[0].address+"-"+i, label: data[0].name, textnote: data[0].name }, classes: 'bottom-center ', position: { x: 0, y: i*100 } },]);
            //cy.add(eles);
            //cy.style().selector('#' + data[0].address+"-"+i).css({ 'background-image': getPicURL(data[0].picurl,profilepicbase,data[0].address) });


            var eles = cy.add([
                { group: 'nodes', data: { label: data[i].name, id: data[i].address, textnote: data[i].name }, classes: 'bottom-center', position: { x: x, y: y } },
                //{ group: 'nodes', data: { label: data[i].name, id: data[i].address+"-2", textnote: data[i].name }, classes: 'bottom-center', position: { x: 200, y: i*100 } },

                /*{ group: 'edges', data: { id: data[i].member+data[i].inter, source: data[i].member, target: data[i].inter }, classes: edgecolorsize1 },*/
                { group: 'edges', data: { id: data[i].address + "edge", source: data[i].address, target: data[0].address, textnote: textNote1 } },
                { group: 'edges', data: { id: data[i].address + "edge2", source: data[0].address, target: data[i].address, textnote: textNote2 } },
            ]);
            cy.add(eles);

            cy.style().selector('#' + data[i].address).css({ 'background-image': getPicURL(data[i].picurl, profilepicbase, data[i].address) });
            cy.style().selector('#' + data[i].address).css({ 'background-image': getPicURL(data[i].picurl, profilepicbase, data[i].address) });


            //let width=Math.min((8+size*12),24);
            //let styles={'width': (8+size*12), 'target-arrow-shape': 'none'};
            //if (ratio>=2){
            //    styles={'width': (8+size*12), 'target-arrow-shape': 'triangle'};
            //}
            //if(valgiven>valreceived){
            let sizeReceived = valgiven / data[1].totalconnection;
            let sizeGiven = valreceived / data[1].totalconnection;

            cy.style().selector('#' + data[i].address + "edge2").css({ 'width': Math.min((4 + sizeReceived * 24), 20) });
            cy.style().selector('#' + data[i].address + "edge").css({ 'width': Math.min((4 + sizeGiven * 24), 20) });
            //}else{
            //    cy.style().selector('#'+data[i].address+"edge").css(styles);
            //    cy.style().selector('#'+data[i].address+"edge2").css({'width': 0});    
            //}

            //let theRatingAbs=Math.abs(theRating2-3);
            //let linecolor='rgb('+(214-98*theRatingAbs)+','+(244-60*theRatingAbs)+','+(255-35*theRatingAbs)+')';
            //if(theRating2<3){linecolor='rgb(242,'+(228-92*theRatingAbs)+','+(228-97*theRatingAbs)+')';}
            //let lineWidth=((Number(data[i].likevaluereceivedonposts)+Number(data[i].likevaluereceivedonreplies)/5)*10-min)/spread;
            //let lineWidth2=((Number(data[i].likevaluegivenonposts)+Number(data[i].likevaluegivenonreplies)/5)*10-min)/spread;



            //cy.style().selector('#'+data[i].address+"edge").css({'width': (4+lineWidth), 'line-color':linecolor, 'target-arrow-color': linecolor});
            //cy.style().selector('#'+data[i].address+"edge").css({'width': (4+Math.abs(ratio)*5)});
            //cy.style().selector('#'+data[i].address+"edge2").css({'width': (4+lineWidth2)});

            //theRatingAbs=Math.abs(theRating-3);
            //linecolor='rgb('+(214-98*theRatingAbs)+','+(244-60*theRatingAbs)+','+(255-35*theRatingAbs)+')';
            //if(theRating<3){linecolor='rgb(242,'+(228-92*theRatingAbs)+','+(228-97*theRatingAbs)+')';}
            //cy.style().selector('#'+data[i].inter).css({'border-width': (4+theRatingAbs*4), 'border-color':linecolor});

        }

        cy.userZoomingEnabled(false);
        cy.center();
        cy.fit();

        cy.on('tap', 'node', function () {
            window.location.href = "#support?qaddress=" + this.data('id').split('-')[0];
        });

        cy.on('mouseover', 'node', function (event) {
            document.getElementById('cynote').textContent = this.data('textnote');
        });

        cy.on('mouseover', 'edge', function (event) {
            document.getElementById('cynote').textContent = this.data('textnote');
        });

        addDynamicHTMLElements();

    }, function (status) { //error detection....
        showErrorMessage(status, page, theURL);
    });

}



