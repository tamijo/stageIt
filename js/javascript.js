var dancerCounter=0; //used to add id to dancers
var propCounter=0;
var formationCounter=1;
var arrowstartX = 0; //used to keep track of an arrow object beginning and end
var arrowstartY=0;
var arrowendX = 0;
var isSaved = false;
var arrowendY=0;
var drawPath='none';	//flag for whenever draw arrow button is pressed
var startDrawPath=false; 
var movePath=false;
var selectTool=false; //verifies the select tool
var lastCanvasState;
var listOfPaths=[];	//list of current paths on canvas
var listOfObjects=[];
var selectedObjects=[];
var undoStack=[];	//stack of all actions to undo
var redoStack=[];	//stack of all actions to redo


$.getScript('http://code.createjs.com/easeljs-0.6.0.min.js', function()
{
    // script is now loaded and executed.
    // put your dependent JS here.
		
	arrowStage= new createjs.Stage(document.getElementById("arrow-canvas"));
	arrowStage.enableMouseOver();
	arrowUpdate=false;
	console.log("createjs updated");
});
$(document).ready(function() {
	//formation = new Formation(formationCounter, stage);
	
	
});


$('#projectName').hover(function(){
	$(this).append(' <i class="icon-pencil" id="icon-pencil"></i>')}, 
	function(){
	$(this).children("i").remove();
	});

$("#delete-container").droppable({
	accept:".added",
	hoverClass: "delete-hover",
	tolerance: "touch",
	drop: function (event, ui){
		//console.log(ui.helper.css("height"));
			
		var size = new Object();
		size.height =$(ui.helper).height();
		size.width = $(ui.helper).width();
		tempDrag.size = size;
		tempDrag.undoType="delete_object";
		$(ui.draggable).remove();
		undoStack.push(tempDrag);
		redoStack=[];
		tempDrag=new Object();
		//console.log(ui);
	}
});


function clearCanvas(clearDancers){
	if(clearDancers){
		$('div.added').remove();
	}
	var path_canvas = document.getElementById('arrow-canvas');
	var path_context = path_canvas.getContext('2d');
	path_context.clearRect(0, 0, path_canvas.width, path_canvas.height);
	arrowStage.removeAllChildren(); //deletes all the paths in the canvas
	$('#notes > textarea').val("");
	
	listOfPaths=[];
	undoStack=[];
	redoStack=[];
	createNewFormation();
}


function createNewFormation(){
	formationCounter++;
	var newRow = $('<tr><td class="current formation-name" id="formation'+formationCounter+'"><a><label>Untitled Formation '+formationCounter
	+'</label></a></td></tr>');
	$('table#formations').find('*').removeClass("current");
	newRow.appendTo($('#formations tbody'));
	$('#projectName').text("Untitled Formation "+formationCounter).addClass("default");
}

$('#newFormation').click( function(){
	if($('div.added').length>0){
		bootbox.dialog("Would you like to keep the dancers on the stage in the next formation?", 
			[
			{
		    "label" : "Yes",
		    "class" : "btn-primary",
		    "callback": function() {
		        clearCanvas(false);
		    }
		}, {
		    "label" : "No",
		    "class": "btn",
		    "callback": function() {
		        clearCanvas(true);
		    }
		},{
			"label":"Cancel",
			"class":"btn"
		}]);
	// var formationNum = $('#formations').length+1;
	// $('<tr><td class="current" id="formation'formationNum+'"><a><label>Untitled Formation '+formationNum
	// 	+'</label></a></td></tr>');
	}
	else{
		bootbox.confirm("Create a new formation?", function(result){
			if(result){
				clearCanvas(true);
			}
		})
	}

});
$('#undo').click( function(){
	//console.log("undo");
	
	if(undoStack.length==0){
		//disable undo stack
	}
	else{
		var action = undoStack.pop();
		//console.log(action.undoType);
		switch(action.undoType){
			case "arrow": //means arrow
				action.object=listOfPaths.pop();
				redrawPaths();
				break;
			case "add":
				//console.log(action.object);
				action.object.remove();
				
				break;
			case "delete_object":
				//console.log(action);
				div = action.object.helper;
				div = reAddObject(div, action);
				div.css({
					'position':'absolute',
					'top':action.oldPos.top,
					'left':action.oldPos.left,
					'width':action.size.width-10,
					'height':action.size.height-10,
				});
				console.log(action.size.width-10);
				$("#canvasWrapper").append(div);
				//console.log("delete has been undone");
				break;
			case "delete_arrow":
				alert("this action has not be implemented, sorry");
				break;
			case "drag":
				//console.log("about to undo drag");
				div = action.object.helper;
				div.css({
					'position':'absolute',
					'top':action.oldPos.top,
					'left':action.oldPos.left,
				});
				
				//$("#canvasWrapper").append(action.object.helper);
				//console.log(action.object);
				break;
			case "resize":
				//console.log("about to undo resize");
				div = action.object.helper;
				div.css({
					'position':'absolute',
					'width':action.oldSize.width,
					'height':action.oldSize.height,
				});
				break;
			case "rename":
				console.log(action.object);
				action.object.find('.text').text(action.oldName);
				//action.object[0].innerHTML(action.oldName);
				break;
		}
		redoStack.push(action);
	}	
})
$('#redo').click( function(){
	//console.log("redo");
	
	if(redoStack.length==0){
		//disable redoButton
	}
	else{
		var action = redoStack.pop();
		//console.log(action.undoType);
		switch(action.undoType){
			case "arrow": //means arrow
				listOfPaths.push(action.object);
				redrawPaths();
				break;
			case "add":
				//action.object.remove();
				div = action.object;
				//console.log(action);
				div = reAddObject(div, action);
				//this is QUICKFIX, TODO:fix this image
						div.css({
							'width':action.size.width,
							'height':action.size.height,
						});
				//end quickfix
				$("#canvasWrapper").append(div);
				//console.log(action);
				//console.log("add has been redone");
				break;
			case "delete_object":
				//console.log(action.object);
				action.object.helper.remove();
				break;
			case "delete_arrow":
				alert("this action has not be implemented, sorry");
				break;
			case "drag":
				//console.log("about to undo drag");
				//action.object.helper.offsetTop=action.oldPos.top;
				//action.object.helper.offsetLeft=action.oldPos.left;
				div = action.object.helper;
				div.css({
					'position':'absolute',
					'top':action.newPos.top,
					'left':action.newPos.left,
				});
				
				//$("#canvasWrapper").append(action.object.helper);
				//console.log(action.object);
				break;
			case "resize":
				//console.log("about to undo resize");
				div = action.object.helper;
				div.css({
					'position':'absolute',
					'width':action.newSize.width,
					'height':action.newSize.height,
				});
			case "rename":
				console.log(action.object);
				action.object.find('.text').text(action.newName);
				break;
		}
		undoStack.push(action);
	}	
})
$('.option li').click(function(){
	var option = $(this).parent().attr('data-option');
	$(this).addClass(option+'-selected').siblings().removeClass(option+'-selected');
});

$('#addDancersModal .option img').click(function(){
	var shape = $(this).parent().attr('id');
	var color = $('input[name="color"]:radio:checked').attr('value');
	$('#preview-img').attr("src", "img/"+shape+'-'+color+'.png').css("border", "none");
})

$('#addDancersModal input[type="radio"]').click(function(){
	if($('#preview-img').attr('id').length > 0){
		changeColorOfImage($(this).attr('value'));
	}
});

function changeColorOfImage(color){
	var curr = $('#preview-img').attr('src');
	if (curr.search('square')!=-1){ //in src ->current image is square
		$('#preview-img').attr('src', 'img/square-'+color+'.png');
	}
	else if (curr.search('circle')!=-1){
		$('#preview-img').attr('src', 'img/circle-'+color+'.png');
	}
	else if (curr.search('triangle')!=-1){
		$('#preview-img').attr('src', 'img/triangle-'+color+'.png');
	}
}


$('#spinner_numDancers').keyup(function (e) {
    	if (e.keyCode == 13 && $("#spinner_numDancers")){ //enter and spinner field in focus
    		addDancers();
    	}
    });
	
//path/arrow functions... we probably need to decide on a name, I used them interspersed...
function drawPathPrompt(){
	if(drawPath=='none'){
		var prompt = "<div id=\"pathNotif\" class=\"notif\" > Draw an arrow by clicking and dragging on the stage<br> <button id=\"endPath\" onclick=\"endPath()\"> Cancel</div>"
		
		$(prompt).appendTo("#canvasWrapper").addClass('animated fadeIn');
		////console.log(prompt);
		document.getElementById('straightPathTool').disabled=true;
		drawPath='straight';
		disableDraggableObjects(true);
	}
}
function drawCurvePathPrompt(){
	if(drawPath=='none'){
		var prompt = "<div id=\"pathNotif\" class=\"notif\"> Draw a curved arrow by clicking and dragging on the stage<br> <button id=\"endPath\" onclick=\"endPath()\"> Cancel</div>"
		
		$(prompt).appendTo("#canvasWrapper").addClass('animated fadeIn');
		//console.log(prompt);
		document.getElementById('straightPathTool').disabled=true;
		drawPath='curve';
		disableDraggableObjects(true);
	}
}
function movePathPrompt(){
	console.log(movePath);
	if(!movePath){
		movePath=true;
		var prompt = "<div id=\"pathNotif\" class=\"notif\"> Move an arrow by clicking and dragging on the stage<br> <button id=\"endPath\" onclick=\"endPath()\"> Cancel</div>"
		
		$(prompt).appendTo("#canvasWrapper").addClass('animated fadeIn');
		////console.log(prompt);
		console.log("moveTool");
		
		disableDraggableObjects(true);
	}else{
		movePath=false;
		endPath();
	}
}
function drawSelectPrompt(){
	if(!selectTool){
		var prompt = "<div id=\"selectNotif\" class=\"notif\"> Click on each object that you would like to select <br> <button id=\"doneSelect\" onclick=\"doneSelect()\"> Done <button id=\"selectAll\" onclick=\"selectAll()\"> Select All <button id=\"endSelect\" onclick=\"endSelect()\"> Cancel</div>"
		selectTool=true;
		$(prompt).appendTo("#canvasWrapper").addClass('animated fadeIn');
		console.log('selectTool');
		enableSelect();
		//TODO add disable all other tools here? 
		
	}
	else{
		selectTool=false;
	}
}
function doneSelect(){
	clearPrompt();
	var prompt = "<div id=\"selectNotif\" class=\"notif\"> The next actions will correspond to all the dancers, you can drag, resize, ... <br> <button id=\"endSelect\" onclick=\"endSelect()\"> Done</div>";
	$(prompt).appendTo("#canvasWrapper").addClass('animated fadeIn');
	console.log('reenable things');	
	for (var i = 0; i<dancerCounter; i++){
	
			var divname="#dancer-"+i;
			var div = $(divname);
			var img = $('<img class=\"overlay\">').attr('src', 'img/highlight.png');
			$(div).append(img);
			div.draggable({disabled:false,
				zIndex:100,
				containment:'#canvasWrapper',
				grid: [ 20,20 ],
				start: function(e, ui) {
					//$(ui.helper).css("border", "1px solid red");
					var img = $('<img class=\"overlay\">').attr('src', 'img/highlight.png');
					
					//beginDrag(ui);
					posTopArray=[];
					posLeftArray=[];
					if($(div).hasClass("selected")){
						$(".selected").each(function (i){
							eachtop=$(this).css('top');
							eachleft=$(this).css('left');
							posTopArray[i]=parseInt(eachtop);
							posLeftArray[i]=parseInt(eachleft);
							div.append(img);
							
						});
					}
					begintop = $(this).offset().top; 
					beginleft = $(this).offset().left; 
				},
				stop: function(e, ui) {
					//$(ui.helper).css("border", "none");
					// $(ui.helper).width($(ui.helper).width()-10);
					// $(ui.helper).height($(ui.helper).height()-10);
					$(".overlay").remove();
					endDrag(ui);
				},
				drag: function(event, ui) {
					  var topdiff = $(this).offset().top - begintop;  // Current distance dragged element has traveled vertically
					  var leftdiff = $(this).offset().left - beginleft; // Current distance dragged element has traveled horizontally

					  if ($(this).hasClass("selected")) {
						   $(".selected").each(function(i) {
								$(this).css('top', posTopArray[i] + topdiff); // Move element veritically - current css top + distance dragged element has travelled vertically
								$(this).css('left', posLeftArray[i] + leftdiff); // Move element horizontally - current css left + distance dragged element has travelled horizontally
						   });
					  }
				 },
			});
			div.resizable({disabled:false});
		/*	$(div).selectable({
				helper: function(){
				  var selected = $('input:checked').parents('li');
				  console.log(selected);
				  if (selected.length === 0) {
					selected = $(this);
				  }
				  var container = $('<div/>').attr('id', 'draggingContainer');
				  container.append(selected.clone());
				  return container; 
				}
			});*/
	}
	
}
function selectAll(){
	
	for (var i = 0; i<dancerCounter; i++){
			var divname="#dancer-"+i;
			var div = $(divname);
			$(div).addClass('selected');
			var img = $('<img class=\"overlay\">').attr('src', 'img/highlight.png');
			$(div).append(img);
	}
	doneSelect();
}
function enableSelect(){
	dancerToggle = {};
		for (var i = 0; i<dancerCounter; i++){
			var divname="#dancer-"+i;
			var div = $(divname);
			console.log(div);
			dancerToggle[i]=0;
			div.selectable({
				disabled:false,
				//appendTo:".shape",
				selected:function(e, ui){
					var img = $('<img class=\"overlay\">').attr('src', 'img/highlight.png');
					
					var idnum = $(this)[0].id.replace('dancer-', '');
					dancerToggle[idnum]=dancerToggle[idnum]+1;
					console.log(idnum);
					console.log(dancerToggle[idnum]);
					if(dancerToggle[idnum]%2==0){
						$(this).removeClass('selected');
						$('div#dancer-'+idnum+' img:last-child').remove();
						console.log($(this).context.id +' removed');
					}else{
						$(this).addClass('selected');
						$(this).append(img);
						console.log($(this)[0].id + ' selected');
					}
					//$(this).append(img);
				},
				unselected:function(e,ui){
					//console.log(ui);
					
					//$(this).remove(".overlay");
					//console.log($(this));
					console.log($(this).context.id +' removed');
					//$(this).css("border", "none");
				},
				
			});
			div.draggable({disabled:true});
			div.resizable({disabled:true});
		}
}
function selectObject(){
	selectTool=true;
	drawSelectPrompt();
	
}
function clearPrompt(){
	(elem=document.getElementById("selectNotif")).parentNode.removeChild(elem);
}
function endSelect(){
	(elem=document.getElementById("selectNotif")).parentNode.removeChild(elem);
	for (var i = 0; i<dancerCounter; i++){
			var div = $("#dancer-"+i);
			//console.log(div);
			
			div.removeClass('selected');
			div.selectable({disabled:false});
			div.draggable({disabled:false});
		}
}
function endPath(){
	(elem=document.getElementById("pathNotif")).parentNode.removeChild(elem);
	//(elem=document.getElementById("cancelPath")).parentNode.removeChild(elem); removed whole div, not needed
	document.getElementById('straightPathTool').disabled=false;
	drawPath='none';
	////console.log("cancel path");
	disableDraggableObjects(false);
}
function redrawPaths(){

	var canvas = document.getElementById('arrow-canvas');
		var context = canvas.getContext('2d');
		context.clearRect(0, 0, canvas.width, canvas.height);
		arrowStage.clear();
		arrowStage.canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
		arrowStage.removeAllChildren();
		for(var i=0; i<listOfPaths.length; i++){
			drawArrow(listOfPaths[i]);
		}
		////console.log(listOfPaths);
}
$('#arrow-canvas').mousedown(function(e){
	////console.log('mousedown');
	if(!(drawPath=='none')){
		var x;
		var y;
		if (e.pageX || e.pageY) { 
		  x = e.pageX;
		  y = e.pageY;
		}
		arrowstartX=x;
		arrowstartY=y;
		startDrawPath=true;
		
	}
})
var arrowPath=[];
$('#arrow-canvas').mousemove( function(e){
	//////console.log('mousemove' + e.pageX+' ' +e.pageY);
	if(startDrawPath&&!(drawPath=='none')){
			redrawPaths();
		move=new Object();
		move.type=drawPath;
		var pos = new Object();
		if (e.pageX || e.pageY) { 
		  pos.x = e.pageX;
		  pos.y = e.pageY;
		}
		move.startx = arrowstartX;
		move.starty = arrowstartY;
		
		if(move.type=='curve'){
			arrowPath.push(pos)
			move.path=arrowPath;
			//console.log(arrowPath);
		}
		move.endx=pos.x;
		move.endy = pos.y;
		drawArrow(move);
	}
})

$('body').mouseup( function(e){
	if(startDrawPath&&!(drawPath=='none')){
			redrawPaths();
		move=new Object();
		var offset=$("#arrow-canvas").offset();
		var x; var y;
		if (e.pageX || e.pageY) { 
		  x = e.pageX-offset.left;
		  y = e.pageY-offset.top;
		}
		var canvas = document.getElementById('arrow-canvas');
		////console.log('cheight= '+canvas.height);
		////console.log('cwidth= '+canvas.width);
		if(x>0&&y>0&&x<canvas.width&&y<canvas.height){
			move.startx = arrowstartX;
			move.starty = arrowstartY;
			move.endx = e.pageX;
			move.endy = e.pageY;
			if(Math.abs(move.startx-move.endx)>5&&Math.abs(move.starty-move.endy)>5){
				move.type=drawPath;
				if(move.type=='curve'){
					move.path=arrowPath
					arrowPath=[]
				}
				drawArrow(move);
				listOfPaths.push(move);
				//console.log('path pushed');
				move.undoType="arrow";
				undoStack.push(move);
				redoStack=[];
			}else{console.log('not moved');}
			
			endPath();
		}
		else{
			endPath();
			////console.log("path canceled");	
			////console.log("e.pageX= "+e.pageX);
			////console.log("e.pageY= "+e.pageY);
		}
		drawPath='none';
		startDrawPath=false;
	}
})

function changeColorOfImage(color){
	var curr = $('#preview-img').attr('src');
	if (curr.search('square')!=-1){ //in src ->current image is square
		$('#preview-img').attr('src', 'img/square-'+color+'.png');
	}
	else if (curr.search('circle')!=-1){
		$('#preview-img').attr('src', 'img/circle-'+color+'.png');
	}
	else if (curr.search('triangle')!=-1){
		$('#preview-img').attr('src', 'img/triangle-'+color+'.png');
	}
}





// things that need to be reset when modals are hidden
$('#chooseStage').on('hidden', function(){
	$('#stages li').removeClass('stage-selected');
	$('#stageHelper').css("display", "none");
	$('.hidden').css("display", "inline");
	////console.log("#chooseStage");
});

$('#choosePropModal').on('hidden', function(){
	$('#props li').removeClass('prop-selected');
	$('#propHelper').css("display", "none");
	////console.log("#choosePropModal");
});

$('#chooseArrangementModal').on('hidden', function(){
	//console.log("#chooseArrangmentModal closed");
});

//close stage modal dialog
function closeStageDialog() {
	$('#chooseStage').modal('hide'); 
};

//function called when ok button is clicked on stage modal
function drawStage() {
	//check if there is something selected
	if(!$('.stage-selected').length > 0){
		$('#stageHelper').css("display", "inline");
	}
	else{
		var stage = $('.stage-selected').attr('id');
		closeStageDialog();
		drawStageShape(stage);
	}
	
}

function drawStageShape(stage){
	switch(stage){
		case 'rectangle':
			drawRectangleStage();
			break;
		case 'semicircle':
			drawSemiCircleStage();
			break;
		case 'circle':
			drawCircleStage();
			break;
		case 'oval':
			drawOvalStage();
			break;
		case 'trapezoidSmallFront':
			drawTrapezoidSmallFrontStage();
			break;
		case 'trapezoidBigFront':
			drawTrapezoidBigFrontStage();
			break;
	}
}

function drawRectangleStage(){
	var canvas = document.getElementById('canvas-stage');
	var ctxt = canvas.getContext('2d');
	ctxt.clearRect(0, 0, canvas.width, canvas.height);
	ctxt.beginPath();
	ctxt.rect(50, 0, canvas.width-100, canvas.height-25);
	ctxt.fillStyle = 'white';
	ctxt.fill();
	ctxt.lineWidth = 1;
	ctxt.strokeStyle = 'gray';
	ctxt.stroke(); 
}
function drawSemiCircleStage(){
	var canvas = document.getElementById('canvas-stage');
	var ctxt = canvas.getContext('2d');
	ctxt.clearRect(0, 0, canvas.width, canvas.height);
	ctxt.beginPath();
	var x = canvas.width-285;
	var y = 0;
	var radius = canvas.width/2-10;
	var startAngle = 0; endAngle = Math.PI;
	ctxt.arc(x,y,radius, startAngle,endAngle);
	ctxt.closePath();
	ctxt.lineWidth = 1;
	ctxt.fillStyle = 'white';
	ctxt.fill();
	ctxt.strokeStyle = 'gray';
	ctxt.stroke();	
}
function drawCircleStage(){
	var canvas = document.getElementById('canvas-stage');
	var ctxt = canvas.getContext('2d');
	ctxt.clearRect(0, 0, canvas.width, canvas.height);
	ctxt.beginPath();
	var x = canvas.width/2;
	var y = canvas.height/2;
	var radius = canvas.width/4;
	var startAngle = 0; endAngle = Math.PI*2;
	ctxt.arc(x,y,radius, startAngle,endAngle, false);
	ctxt.closePath();
	ctxt.lineWidth = 1;
	ctxt.fillStyle = 'white';
	ctxt.fill();
	ctxt.strokeStyle = 'gray';
	ctxt.stroke();	
	//TODO: why is it an oval..?
}
function drawOvalStage(){
	var canvas = document.getElementById('canvas-stage');
	var ctxt = canvas.getContext('2d');
	ctxt.clearRect(0, 0, canvas.width, canvas.height);
	ctxt.save();
	ctxt.beginPath();
	var centerX = canvas.width/4;
	var centerY = canvas.height/2;
	var radius = canvas.width/4;
	ctxt.scale(2,1);
	var startAngle = 0; endAngle = Math.PI*2;
	ctxt.arc(centerX, centerY, radius, startAngle, endAngle, false);
	ctxt.lineWidth = 1;
	ctxt.fillStyle = 'white';
	ctxt.fill();
	ctxt.strokeStyle = 'gray';
	ctxt.stroke();	
	ctxt.restore();
}
function drawTrapezoidSmallFrontStage(){
	var canvas = document.getElementById('canvas-stage');
	var ctxt = canvas.getContext('2d');
	ctxt.clearRect(0, 0, canvas.width, canvas.height);
	ctxt.beginPath();

	var base0 = canvas.width;
	var base1 = 0;
	var top0 = canvas.width-100;
	var top1 = 100;
	var height = canvas.height-25;

  	ctxt.moveTo(top0,height);
  	ctxt.lineTo(top1,height);
  	ctxt.lineTo(base1,0);
  	ctxt.lineTo(base0,0);
  	ctxt.closePath();

	ctxt.lineWidth = 1;
	ctxt.fillStyle = 'white';
	ctxt.fill();
	ctxt.strokeStyle = 'gray';
	ctxt.stroke(); 
}
function drawTrapezoidBigFrontStage(){
	var canvas = document.getElementById('canvas-stage');
	var ctxt = canvas.getContext('2d');
	ctxt.clearRect(0, 0, canvas.width, canvas.height);
	ctxt.beginPath();

	var base0 = canvas.width;
	var base1 = 0;
	var top0 = canvas.width-100;
	var top1 = 100;
	var height = canvas.height-25;

  	ctxt.moveTo(base0,height);
  	ctxt.lineTo(base1,height);
  	ctxt.lineTo(top1,0);
  	ctxt.lineTo(top0,0);
  	ctxt.closePath();

	ctxt.lineWidth = 1;
	ctxt.fillStyle = 'white';
	ctxt.fill();
	ctxt.strokeStyle = 'gray';
	ctxt.stroke(); 
}
function drawArrow(arrow){
		//stroke method of arrow
		//arrow will have start and end coordinates
		ratio=10;
		var offset=$("#arrow-canvas").offset();
			
			
			starty=arrow.starty-offset.top;
			startx=arrow.startx-offset.left;
			endy=arrow.endy-offset.top;
			endx=arrow.endx-offset.left;
			var angle = Math.atan2(endy-starty,endx-startx);
			shapeArrow=new createjs.Shape();
			shapeArrow.graphics.setStrokeStyle(6,1);
			shapeArrow.graphics.beginStroke(createjs.Graphics.getRGB(0,0,0,.5));
			shapeArrow.graphics.moveTo(startx, starty);
			var minLeft=endx;var minTop=endy;
			if(arrow.type=='curve'){
					var anglesum=0;
					var anglesumcount=0;
					for (var i=0;i<arrow.path.length; i++){
						shapeArrow.graphics.lineTo(arrow.path[i].x-offset.left,arrow.path[i].y-offset.top);
						if (arrow.path.length-i<10){
							anglesumcount++;
							anglesum+=Math.atan2(endy-arrow.path[i].y+offset.top,endx-arrow.path[i].x+offset.left);
						}
						if (arrow.path[i].x<minLeft){
							minLeft=arrow.path[i].x-offset.left;
						}
						if (arrow.path[i].y<minTop){
							minTop=arrow.path[i].y-offset.top;
						}
					}
					angle=anglesum/anglesumcount;
				}
			shapeArrow.graphics.lineTo(endx, endy);
			shapeArrow.graphics.lineTo(endx+1, endy+1);
					shapeArrow.graphics.moveTo(endx, endy);
						shapeArrow.graphics.lineTo(endx-ratio*Math.cos(angle+Math.PI/4),endy-ratio*Math.sin(angle+Math.PI/4)); //first tip of arrow
						shapeArrow.graphics.moveTo(endx, endy);
						shapeArrow.graphics.lineTo(endx-ratio*Math.cos(angle-Math.PI/4),endy-ratio*Math.sin(angle-Math.PI/4)); //second tip of arrow
						shapeArrow.graphics.moveTo(endx, endy);	
			shapeArrow.graphics.endStroke();
			var min=new Object();
			min.top=minTop;
			min.left=minLeft;
			//console.log(min);
			shapeArrow.min=min;
			shapeArrow.onPress = arrowPressHandler;
			arrowStage.addChild(shapeArrow);
			arrowStage.update();
			createjs.Ticker.addListener(window);
			var canvas = document.getElementById('arrow-canvas');
			return shapeArrow;
					////console.log('awesomesauce');
					////console.log(startx+endy);
					/*var context = canvas.getContext('2d');
					context.lineCap='round';
					
					context.strokeStyle = 'rgba(0, 0, 0, .5)'; //black arrow
					context.lineWidth  =5;
					
					context.beginPath();
					context.moveTo(startx, starty);
					if(arrow.type=='curve'){
						var anglesum=0;
						var anglesumcount=0;
						for (var i=0;i<arrow.path.length; i++){
							context.lineTo(arrow.path[i].x-offset.left,arrow.path[i].y-offset.top);
							if (arrow.path.length-i<10){
								anglesumcount++;
								anglesum+=Math.atan2(endy-arrow.path[i].y+offset.top,endx-arrow.path[i].x+offset.left);
							}
						}
						angle=anglesum/anglesumcount;
					}
					context.lineTo(endx+1, endy+1);
					context.moveTo(endx, endy);
						context.lineTo(endx-ratio*Math.cos(angle+Math.PI/4),endy-ratio*Math.sin(angle+Math.PI/4)); //first tip of arrow
						context.moveTo(endx, endy);
						context.lineTo(endx-ratio*Math.cos(angle-Math.PI/4),endy-ratio*Math.sin(angle-Math.PI/4)); //second tip of arrow
						context.moveTo(endx, endy);	
					//context.closePath();
					context.stroke();*/
					
		
			
		
}
function arrowPressHandler(e){
	 e.onMouseMove = function(ev){	
		 	  e.target.x = ev.stageX-e.target.min.left;
			  e.target.y = ev.stageY-e.target.min.top;
			  console.log("x:"+ev.stageX)
			  console.log("startx:"+e.target.min.left);
			  /*if(Math.abs(e.target.min.left-e.target.x)<50){
			  e.target.min.left = e.target.x;
			  }
			  if(Math.abs(e.target.min.top-e.target.y)<50){
			  e.target.min.top = e.target.y;
			  }*/
				
		  
		//console.log(e.target);
	  
		arrowUpdate = true;
	 }
 
}
function tick(){ 
 if(arrowUpdate){
  arrowUpdate = false;
  arrowStage.update(); 
 }
}


function addDancers(){
	if(!$('.dancer-selected').length > 0){
		$('#dancerHelper').css("display", "inline");
	}
	else{
		var shape = $('.dancer-selected').attr('id');
		////console.log(shape);
		var color = $('input[name=color]:radio:checked').attr('value');
		////console.log(color);
		var numDancers = $("#spinner_numDancers").val();
		////console.log(numDancers);
		closeAddDancersDialog();	
		var x = 30;
		var y = 10;
		for(var i=0; i < numDancers; i++){
			var id="dancer-"+dancerCounter;
			dancerCounter++;
			var wrap = $('<div><div class="text"></div></div>').attr('id', id);
			var img = $('<img class=\'dancer-img\'>').attr('src', 'img/'+shape+'-'+color+'.png');
			wrap.append(img);
			// wrap.css('background','transparent url('+url+')');
			if(y>440){
				y=10;
				x+=60;		
			}
			addObjectAt(wrap, x,y, 'shape');
			y+=60; //wont work for large amounts, add handling.
		}

	}	 

}

function reAddObject(div, action){
	div.resizable({
		  aspectRatio: 1 / 1,
		  maxWidth: 140,
		  addClasses: false,
		  start:function(e,ui){ 
			beginResize(ui);
		  },
		  stop:function(e,ui){
			endResize(ui);
		  },
		});
	div.draggable({
			zIndex:100,
			containment:'#canvasWrapper',
			grid: [ 20,20 ],
			start: function(e, ui) {
				// $(ui.helper).width($(ui.helper).width()+10);
				// $(ui.helper).height($(ui.helper).height()+10);
				var img = $('<img class=\"overlay\">').attr('src', 'img/highlight.png');
				div.append(img);
				beginDrag(ui);
			},
			stop: function(e, ui) {
				// $(ui.helper).width($(ui.helper).width()-10);
				// $(ui.helper).height($(ui.helper).height()-10);
				$(".overlay").remove();
				endDrag(ui);
			}
		});
	
	console.log(div);
	if(div.hasClass("shape")){
		console.log('newShape');
		
	    div.dblclick(function(){
	    	action = new Object();
			action.object = $(this);
			action.oldName = $(this)[0].innerText;
			console.log("rename");
	    	var newText = prompt("Enter text to display in element:");
				if(newText != null){
					$(this).find('.text').text(newText);
				}
			action.newName = newText;
			action.undoType = "rename";
			undoStack.push(action);
			redoStack=[];
		})
	}
	return div;
}
function addObjectAt(div,posX,posY,newClass){
	div.css({
		'position':'absolute',
		'top':posY,
		'left':posX,
	});
	div.addClass("added");
	div.addClass('animated bounceIn');
	div.addClass(newClass);
	div.resizable({
      aspectRatio: 1 / 1,
      maxWidth: 140,
      addClasses: false,
	  start:function(e,ui){ 
		beginResize(ui);
	  },
	  stop:function(e,ui){
		endResize(ui);
	  },
    });
    div.draggable({
            zIndex:100,
            containment:'#canvasWrapper',
            grid: [ 20,20 ],
            start: function(e, ui) {
            	//$(ui.helper).css("border", "1px solid red");
				var img = $('<img class=\"overlay\">').attr('src', 'img/highlight.png');
				div.append(img);
		        // $(ui.helper).width($(ui.helper).width()+10);
		        // $(ui.helper).height($(ui.helper).height()+10);
				//console.log(ui);
				beginDrag(ui);
		    },
		    stop: function(e, ui) {
		    	//$(ui.helper).css("border", "none");
		        // $(ui.helper).width($(ui.helper).width()-10);
		        // $(ui.helper).height($(ui.helper).height()-10);
				$(".overlay").remove();
				endDrag(ui);
		    }
        });
    div.find('.text').text("Dancer");	//Default name: 'Dancer'
    if(newClass=="shape"){
	    div.dblclick(function(){
	    	action = new Object();
			action.object = $(this);
			action.oldName = $(this)[0].innerText;
			console.log("rename");
	    	var newText = prompt("Enter text to display in element:");
				if(newText != null){
					$(this).find('.text').text(newText);
				}
			action.newName = newText;
			action.undoType = "rename";
			undoStack.push(action);
			redoStack=[];
		})
	}
    $("#canvasWrapper").append(div);
	action = new Object();
	
	action.object=div;
	action.undoType="add";
	position=new Object();
	position.top=posY;
	position.left=posX;
	undoStack.oldPos=position;
	size=new Object;
	size.width = div.css('width');
	size.height = div.css('height');
	action.originSize=size;
	action.size = size;
	undoStack.push(action);
	redoStack=[];
	//console.log(action);
}
function closeAddDancersDialog() {
	$('#addDancersModal').modal('hide'); 
};



function disableDraggableObjects(foo){
	
	if(foo){
		$('#arrow-canvas').css({'pointer-events':'auto', 'cursor':'crosshair'});
	}
	else{
		$('#arrow-canvas').css('pointer-events','none');
		// ////console.log('everything restored');
	}
}

//function called when ok button is clicked on props modal
function addProp() {
	//check if there is something selected
	////console.log(".prop-selected="+$('.prop-selected'));
	if(!$('.prop-selected').length > 0){
		$('#propHelper').css("display", "inline");
	}
	else{
		var item = $('.prop-selected').attr('id');
		////console.log(item);

		closePropDialog();
		var x = 30;
		var y = 10;

		var id="prop-"+propCounter;
		propCounter++;
		////console.log("id="+id);
		var wrap = $('<div></div>').attr('id', id); //id's need to be unique
		var img = $('<img>').attr('src', 'img/'+item+'.png');
		wrap.append(img);
		////console.log(wrap);
		addObjectAt(wrap, x,y, 'propImage');
		////console.log("prop has been added?")
	}	 
	
}
var tempDrag=new Object();
function beginDrag(ui){
	//also the beginning of the delete undo path
	tempDrag.undoType="drag";
	tempDrag.oldPos =ui.position;
	
	//console.log(ui);
	//console.log("beginDrag");
	tempDrag.object=ui;
}
function endDrag(ui){
	tempDrag.object=ui;
	tempDrag.newPos=ui.position;
	undoStack.push(tempDrag);
	redoStack=[];
	tempDrag=new Object();
	//console.log("endDrag");
	////console.log(undoStack[undoStack.length-1]);
}
var tempResize=new Object();
function beginResize(ui){
	tempResize.undoType="resize";
	//console.log(ui);	
	tempResize.oldSize =ui.originalSize;
}
function endResize(ui){
	tempResize.object=ui;
	tempResize.size=ui.size;
	tempResize.newSize=ui.size;
	undoStack.push(tempResize);
	redoStack=[];
	tempResize=new Object();
	////console.log(undoStack[undoStack.length-1]);
}

function closePropDialog() {
	$('#choosePropModal').modal('hide'); 
};

function arrangeDancers(){
	var arrangement = $('input[name=arrangement]:radio:checked').attr('value');
	closeArrangeDialog();
	//alert("At this time, your dancers could not be automatically arranged in a '"+arrangement+"' format. We appologize for any inconvenience.", closeArrangeDialog());


	if($(".selected").length>0){
		selector = ".selected";
	}
	else{
		selector = ".shape";
	}

	 switch(arrangement){
	 	case 'oneHorizLine': 
	 		arrangeInOneHorizLine(selector);
	 		break;
		case 'twoHorizLines': 
			arrangeInTwoHorizLines(selector);
			break;
	 	case 'oneVertLine': 
	 		arrangeInOneVertLine(selector);
	 		break;
	 	case 'twoVertLines': 
	 		arrangeInTwoVertLines(selector);
	 		break;
	 	case 'diamond': 
	 		arrangeInDiamond(selector);
	 		break;
	 	case 'circle': 
	 		arrangeInCircle(selector);
	 		break;
	 	case 'V': 
	 		arrangeInV(selector);
	 		break;
	 	case 'X': 
	 		arrangeInX(selector);
	 		break;
	 }
	// console.log("DANCERS: " + dancers);
	// console.log($('.shape')[0]);
	// console.log($('.shape')[1]);
	// console.log($('.shape').length);

	// dancers.css('top',300);
	// dancers.css('left',300);
}	 

function arrangeInOneHorizLine(selector){
	//console.log(objects.height);
	//console.log(objects.width);

	var canvas = document.getElementById('canvas-stage');
	console.log("canvas height = "+canvas.height);
	console.log("canvas width = "+canvas.width);
	
	var xCenter = (canvas.width/2)+80;
	var yCenter = (canvas.height/2)+50;

	var x = xCenter - (getTotalWidth(selector)/2);
	var y = yCenter - (getMaxHeight(selector)/2);
	//console.log("initial (x,y) = " + x + "," + y);
	var overflow = getTotalWidth(selector)>canvas.width;
	var squeeze = canvas.width/getTotalWidth(selector);
	$(selector).each(function(index) {
	  $(this).css('left',x);
	  $(this).css('top',y);
	  if(overflow){
	  	x = x+(squeeze*$(this).width());
	  }else{
	  	x = x + $(this).width();
	  }
	});
}

function arrangeInTwoHorizLines(selector){
	var canvas = document.getElementById('canvas-stage');
	//console.log("canvas height = "+canvas.height);
	//console.log("canvas width = "+canvas.width);

	var xCenter = canvas.width/2;
	var yCenter = canvas.height/2;

	half = Math.floor($(selector).length/2);
	//console.log("half = "+half);

	var x = xCenter - (getTotalWidth(selector+":lt("+half+")")/2);
	var y = yCenter + (getMaxHeight(selector+":lt("+half+")"));
	//console.log("initial (x,y) = " + x + "," + y);
	var overflow = getTotalWidth(selector+":lt("+half+")")>canvas.width;
	var squeeze = canvas.width/getTotalWidth(selector+":lt("+half+")");
	

	$(selector+":lt("+half+")").each(function(index) {
	  $(this).css('left',x);
	  $(this).css('top',y);
	  if(overflow){
	  	x = x+(squeeze*$(this).width());
	  }else{
	  	x = x + $(this).width();
	  }
	});

	var x = xCenter - (getTotalWidth(selector+":gt("+(half-1)+")")/2);
	var y = yCenter - (getMaxHeight(selector+":gt("+(half-1)+")"));
	var overflow = getTotalWidth(selector+":gt("+(half-1)+")")>canvas.width;
	var squeeze = canvas.width/getTotalWidth(selector+":gt("+(half-1)+")");
	
	
	$(selector+":gt("+(half-1)+")").each(function(index) {
	  $(this).css('left',x);
	  $(this).css('top',y);
	  if(overflow){
	  	x = x+(squeeze*$(this).width());
	  }else{
	  	x = x + $(this).width();
	  }
	});
}

function arrangeInOneVertLine(selector){
	var canvas = document.getElementById('canvas-stage');
	//console.log("canvas height = "+canvas.height);
	//console.log("canvas width = "+canvas.width);
	var xCenter = canvas.width/2;
	var yCenter = canvas.height/2;

	var x = xCenter - (getMaxWidth(selector)/2);
	var y = yCenter - (getTotalHeight(selector)/2);
	//console.log("initial (x,y) = " + x + "," + y);
	var overflow = getTotalHeight(selector)>canvas.height;
	var squeeze = canvas.height/getTotalHeight(selector);
	

	$(selector).each(function(index) {
	  $(this).css('left',x);
	  $(this).css('top',y);
	  if(overflow){
	  	y = y+(squeeze*$(this).height());
	  }else{
	  	y = y + $(this).height();
	  }
	});
}

function arrangeInTwoVertLines(selector){
	var canvas = document.getElementById('canvas-stage');
	//console.log("canvas height = "+canvas.height);
	//console.log("canvas width = "+canvas.width);

	var xCenter = canvas.width/2;
	var yCenter = canvas.height/2;

	half = Math.floor($(selector).length/2);
	//console.log("half = "+half);

	var x = xCenter + (getMaxWidth(selector+":lt("+half+")"));
	var y = yCenter - (getTotalHeight(selector+":lt("+half+")")/2);
	//console.log("initial (x,y) = " + x + "," + y);
	var overflow = getTotalHeight(selector+":lt("+half+")")>canvas.height;
	var squeeze = canvas.height/getTotalHeight(selector+":lt("+half+")");
	

	$(selector+":lt("+half+")").each(function(index) {
	  $(this).css('left',x);
	  $(this).css('top',y);
	  if(overflow){
	  	y = y+(squeeze*$(this).height());
	  }else{
	  	y = y + $(this).height();
	  }
	});

	var x = xCenter - (getMaxWidth(selector+":gt("+(half-1)+")"));
	var y = yCenter - (getTotalHeight(selector+":gt("+(half-1)+")")/2);
	var overflow = getTotalHeight(selector+":gt("+(half-1)+")")>canvas.height;
	var squeeze = canvas.height/getTotalHeight(selector+":gt("+(half-1)+")");
	
	$(selector+":gt("+(half-1)+")").each(function(index) {
	  $(this).css('left',x);
	  $(this).css('top',y);
	  if(overflow){
	  	y = y+(squeeze*$(this).height());
	  }else{
	  	y = y + $(this).height();
	  }
	});
}


function getMaxHeight(selector){
	var maxHeight = 0;
	//console.log("initial max height = "+maxHeight);
	
	$(selector).each(function(index) {
		if($(this).height()>maxHeight){
			maxHeight = $(this).height();
		}
	});
	//console.log("final max height = "+maxHeight);
	return maxHeight;
}

function getMaxWidth(selector){
	var maxWidth = 0;
	//console.log("initial max width = "+maxWidth);
	

	$(selector).each(function(index) {
		if($(this).width()>maxWidth){
			maxWidth = $(this).width();
		}
	});
	//console.log("final max width = "+maxWidth);
	return maxWidth;
}

function getTotalHeight(selector){
	var totHeight = 0;
	//console.log("initial total height = "+totHeight);
	
	$(selector).each(function(index) {
		totHeight = totHeight + $(this).height();
	});
	//console.log("final total height = "+totHeight);
	return totHeight;
}

function getTotalWidth(selector){
	var totWidth = 0;
	//console.log("initial total width = "+totWidth);
	
	$(selector).each(function(index) {
		totWidth = totWidth + $(this).width();
	});
	//console.log("final total width = "+totWidth);
	return totWidth;
}

function closeArrangeDialog() {
	$('#arrangeDancersModal').modal('hide'); 
};

