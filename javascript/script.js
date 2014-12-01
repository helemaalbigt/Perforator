/*
 perforation script

 Thomas Van Bouwel - 2013/2014
 */

/* ***************************** *
 * VARIABLES     				 *
 * ***************************** */
//MAIN
var X = 0;//x,y position of canvas
var Y = 0;
var img = null;//main image
var docW = 0; //document width & height
var docH = 0; 
var stepX = 20; // center-to-center distance for perforation
var stepY = 20;
var initialX = 10; //initial perforation offset 
var initialY = 10;

//hole size
var holesize = "range";
var minD = 0; //min & max diameters D for perforations in perforation range
var maxD = 8;
var capD = 90; //max D on slider

var numberOfSizes = 3;
var sizes = new Array();
var minS = 0;
var maxS = 8;
var s1 = 0;
var s2 = 2;
var s3 = 4;
var s4 = 6;
var s5 = 8;

var minMargin = 3; // minimal margin between perforations
var capMargin = 50; //max margin on slider

var inverted = false; //whether bright areas are perforated (false) or dark areas (true)
var drawLimit = false; //wheter or not certain diameters are ignored
var minDdraw = 0;
var maxDdraw = 90;

var perforations = "circles";//rectangles or circles as perforations
var ortho = true;//orthogonal grid or triangular grid
var pixels = new Array();//pixel array
var scale = 2;//scale of everything on the canvas
var canvas;//main drawing canvas
var ctx;
var OSCanvas;//offscreen canvas
var OSctx;
var svgString = "";//svg string
//SEEKER WINDOW  's' stands for 'seeker'
var Hs = 0;//height & width canvas
var Ws = 0;
var As = 0;//height & width screen
var Bs = 0;
var Xs = 0;//distance scrolled in x&y direction
var Ys = 0;
var hs = 0;//height & width previewimage
var ws = 0;
var as = 0;//height & width seekerwindow
var bs = 0;
var xs = 0;//displacement seeker window in x&y direction
var ys = 0;
var varUpdated = false;//variables updated?


/* ***************************** *
 * ON PAGELOAD 					 *
 * ***************************** */

$(document).ready(function() {
	
	/*
	 * Indent all options in select inputs
	 */
	$( "option" ).each(function() {
		$(this).append("&nbsp;&nbsp;");
	});
	
	/*
	 * Setup canvasses
	 */
	//get the main canvas
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");
	//offscreen (OS) canvas to store the original image as a reference to the generated pattern
	OSCanvas = $('<canvas/>')[0];
	OSctx = OSCanvas.getContext("2d");
	//makes canvas draggable
	//$("#canvas").draggable();
	
	/*
	 * Make menu draggable
	 */
	//$("#scrollable_menu").draggable({ axis: "y", cursor: "move"});
	
	/*
	 * activate sliders
	 */
	$("#minMargin").bind("slider:changed", function(event, data) {
		minMargin = data.value;
	});
	
	/*
	 * Activate Slider, and bind event for on sliderchange update of values
	 */
	//simple sliders
	$('.slider_simple').each(function() {
	    $(this).slider({
	      range: false,
	      min: 0,
	      max: capMargin,
	      value: 2,
	      slide: function( event, ui ) {
	      	//sliding the slider updates the values
	        $( this ).next().next().children().val(ui.value);
	       	$( this ).next().next().children().attr( "value", ui.value);
	        //update parameters
	        updateParameters();
	      }
	    });
	    //update values for first time
	    $( this ).next().next().children().val($( this ).slider('value'));
       	$( this ).next().next().children().attr( "value", $( this ).slider('value'));
 	});
	
	//range sliders
	$('.slider_range').each(function() {
	    $(this).slider({
	      range: true,
	      min: 0,
	      max: capD,
	      values: [ 0, 20 ],
	      slide: function( event, ui ) {
	      	//sliding the slider updates the values
	        $( this ).next().next().val(ui.values[ 0 ]);
	       	$( this ).next().next().attr( "value", ui.values[ 0 ] );
	        $( this ).next().next().next().children().val(ui.values[ 1 ]);
	        $( this ).next().next().next().children().attr( "value", ui.values[ 1 ] );
	        //update parameters
	        updateParameters();
	      }
	    });
	    //update values for first time
	    $( this ).next().next().val($( this ).slider('values',0));
	    $( this ).next().next().next().children().val($( this ).slider('values',1));
       	$( this ).next().next().attr( "value", $( this ).slider('values',0));
        $( this ).next().next().next().children().attr( "value", $( this ).slider('values',1) );
 	});
 	
 	
 	/*
 	 * Update slider positions if input is changed
 	 */
 	//simple sliders
	$(".slider_input_simple").each(function(){
		$(this).change(function(){
			//apply value to slider
			updateParameters();
			$(this).parent().prev().prev().slider('value',$(this).val());
		});
	});
 	//range sliders
	$(".slider_input_range_min").each(function(){
		$(this).change(function(){
			//apply value to slider
			updateParameters();
			$(this).prev().prev().slider('values',0,$(this).val());
		});
	});
	$(".slider_input_range_max").each(function(){
		$(this).change(function(){
			//apply value to slider
			updateParameters();
			$(this).parent().prev().prev().prev().slider('values',1,$(this).val());
		});
	});
	
	/*
	 * add eventlistener to all parameters to update them when changed
	 */
	$( ".input" ).change(function() {
  		updateParameters();
	});
	
	/*
	 * download image manager
	 */
	var link = document.getElementById('downloadlnk');
	link.addEventListener('click', downloadImage, false);
	
	var link = document.getElementById('downloadsvg');
	link.addEventListener('click', downloadSVG, false);
	
	function downloadImage() {
		var canvas = document.getElementById("canvas");
		var fileName = document.getElementById("img_input").files[0].name.split('.')[0] + "_perforations";
		link.download = fileName + ".png";
		var dt = canvas.toDataURL('image/png');
		this.href = dt;
	};
	
	function downloadSVG() {
		//only fire if an image was added
		if (img != null) {
		//var canvas = document.getElementById("canvas");
		
		/*alert(canvas.toSVG());*/
		console.log(svgString);
		//encode the svg in base64 with the btoa() function
		//this.href = "data:application/octet-stream;charset=utf-8;base64,"+btoa(canvas.toSVG());
		var fileName = document.getElementById("img_input").files[0].name.split('.')[0] + "_perforations";
		link.download = fileName + ".svg";
		this.href = "data:application/octet-stream;charset=utf-8;base64,"+btoa(svgString);
		}
	};
	
	/*
	 * update all parameters for the first time
	 */
	updateParameters();
	
});


/* ************************ *
 * DRAWING    				*
 * ************************ */

/**
 * Main Refresh function
 * Clears, resizes, updates and draws the canvas
 * 
 * @param
 * @return 
 */
function refresh() {
	//only draw if an image was added
	if (img != null) {
		prepareDrawing();
		resizeCanvas();
		//update the seeker window on the preview img
		updateSeekerWindowVariables();
		updateSeekerWindow();
		draw();		
	}
}

/**
 * Prepare Canvas for drawing
 * 
 * @param
 * @return
 */
function prepareDrawing(){
	//clear canvas
	canvas.width = canvas.width;
	//reset the svg string
	svgString = "<svg width='"+img.width+"' height='"+img.height+"'>";
}

/**
 * Resize canvas to image size
 * 
 * @param
 * @return
 */
function resizeCanvas(){
	//resize canvas to image size
	//get width/height of parent div
	var W = $('#render_window').width();
	var H = $('#render_window').height();
	//set canvas to width/height of document
	$("#canvas").attr("width", docW*scale);
	$("#canvas").attr("height", docH*scale);
	
	
	//determine the origin of the generated image
	if (docW*scale > W && docH*scale > H) {
		//place canvas in the corner
		$("#canvas").css('left', 0);
		$("#canvas").css('top', 0);
	} else if (docW*scale > W && docH*scale < H) {
		//place canvas in the vertical center
		$("#canvas").css('left', 0);
		$("#canvas").css('top', 0 + H / 2 - docH*scale / 2 + 'px');
	} else if (docW*scale < W && docH*scale > H) {
		//place canvas in the horizontal center
		$("#canvas").css('left', 0 + W / 2 - docW*scale / 2 + 'px');
		$("#canvas").css('top', 0);
	} else {
		//place canvas in the center
		$("#canvas").css('left', 0 + W / 2 - docW*scale / 2 + 'px');
		$("#canvas").css('top', 0 + H / 2 - docH*scale / 2 + 'px');
	}
}

/**
 *Updates all seeker window variables 
 * 
 * @param
 * @return
 */
function updateSeekerWindowVariables() {
	if (img != null) {
		Hs = canvas.height;
		Ws = canvas.width;
	
		var renderWindow = $("#render_window");
		As = renderWindow.height();
		Bs = renderWindow.width();
	
		Xs = renderWindow.scrollLeft();
		Ys = renderWindow.scrollTop();
	
		var previewImg = $("#input_img");
		hs = previewImg.height();
		ws = previewImg.width();
	
		as = hs * As / Hs;
		bs = ws * Bs / Ws;
	
		xs = ws * Xs / Ws;
		ys = hs * Ys / Hs;
	
		varUpdated = true;
	}
}

/**
 *Redraw the seeker window
 * 
 * @param
 * @return 
 */
function updateSeekerWindow() {
	if (varUpdated) {
		updateSeekerWindowVariables()

		var canvas_seeker = document.getElementById("canvas_seeker");
		var ctx = canvas_seeker.getContext("2d");

		//set canvas to width/height of image
		$("#canvas_seeker").attr("width", ws);
		$("#canvas_seeker").attr("height", hs);

		ctx.fillStyle = 'rgba(255,255,255,.5)';
		ctx.fillStyle = 'rgba(0,0,0,.6)';
		// Draw some rectangles.
		ctx.fillRect(0, 0, ws, hs);
		ctx.clearRect(xs, ys, bs, as);
		ctx.strokeStyle = 'rgb(255,255,255)';
		//ctx.strokeRect(xs, ys, bs, as);

		//console.log(H + " " + W + " " + A + " " + B + " " + X + " " + Y + "||" + h + " " + w + " " + a + " " + b + " " + x + " " + y);
	}
}

/**
 *Draw the perf. pattern
 * 
 * @param
 * @return 
 */
function draw(){
	//scale canvas
	ctx.scale(scale, scale);
	
	//draw black rectangle on main canvas (or white if inverted)
	var backgroundFillColor = (!inverted) ? "black" : "white";
	ctx.fillStyle = backgroundFillColor;
	ctx.fillRect(X, Y, docW, docH);
	//SVG
	svgString += "<rect width='"+docW+"' height='"+docH+"' style='fill:"+backgroundFillColor+";' />";
	
	for (var i = 0; initialX + i * stepX < img.width; i += 1) {
		for (var j = 0; initialY + j * stepY < img.height; j += 1) {
			
			//X and Y position on the image
			var posX = initialX + i * stepX;
			var posY = initialY + j * stepY;
			if ((j % 2 === 0) && !ortho) {
				posX += Math.round(stepX / 2);
			}
			if(posX >= img.width) break;
			
			var D = calcD(posX,posY);
				
			//determine perforation colors
			var fillColor = (!inverted) ? "white" : "black";
			var strokeColor = (!inverted) ? "black" : "white";

			//draw perforation (dont draw if limiting drawn perforations)
			if(!drawLimit || (D>=minDdraw && D<=maxDdraw)){
				switch(perforations) {
				    case "rectangles":
				    //draws rectangular perforation
				        ctx.fillStyle = fillColor;
						ctx.fillRect(X + imgToDoc(posX)-D/2, Y + imgToDoc(posY)-D/2, D, D);
						ctx.lineWidth = 1;
						ctx.strokeStyle = strokeColor;
  						//ctx.stroke();
						
						//SVG
						svgString += "<rect x='"+(X + imgToDoc(posX)-D/2)+"' y='"+(Y + imgToDoc(posY)-D/2)+"' width='"+D+"' height='"+D+"'  style='fill:"+fillColor+";stroke-width:1;stroke:"+strokeColor+"' />";
						
				        break;

				    default:
				    	//draws circular perforation by default
				    	ctx.beginPath();
						ctx.arc(X + imgToDoc(posX), Y + imgToDoc(posY), D / 2, 0, 2 * 3.14159265359, false);
						ctx.fillStyle = fillColor;
						ctx.fill();
						ctx.lineWidth = 1;
						ctx.strokeStyle = strokeColor;
  						//ctx.stroke();
						
						//SVG
						svgString += "<circle cx='"+(X + imgToDoc(posX))+"' cy='"+(Y + imgToDoc(posY))+"' r='"+(D/2)+"' stroke='"+strokeColor+"' stroke-width='1' fill='"+fillColor+"' />";

				        break;
				}
				
			}
		}
	}
	/*CLOSE SVG STRING*/
	svgString += "</svg>";
}

/**
 *Calc Diameter
 * 
 * Calculates and returns a diameter
 * 
 * @param float posX
 * @param float posY
 * @return float  
 */
function calcD(posX,posY){
	//the variable we'll return
	var D = 0;
	//mean brightness of point
	var brightness = 0;
	
	//calculate the mean brightness in this area of the image
    //check if value exists
	var pixelIndex = Math.round(img.width*(posY-1)+posX);
	if (pixels[pixelIndex]) {
		var red = pixels[pixelIndex][0];
		var green = pixels[pixelIndex][1];
		var blue = pixels[pixelIndex][2];

		//calculate average
		var R = 0;
		var G = 0;
		var B = 0;
		var a = 0;
		var count = 0;
		for ( k = Math.round(-stepX / 2); k < (stepX / 2); k++) {
			for ( l = Math.round(-stepY / 2); l < (stepY / 2); l++) {
				if (pixels[img.width * (posY - 1 + l) + posX + k]) {
					R += pixels[img.width * (posY - 1 + l) + posX + k][0];
					G += pixels[img.width * (posY - 1 + l) + posX + k][1];
					B += pixels[img.width * (posY - 1 + l) + posX + k][2];
					a += pixels[img.width * (posY - 1 + l) + posX + k][3];
					count++;
				}
			}
		}
		if (parseInt(count) > 0) {
			red = R / count;
			green = G / count;
			blue = B / count;
			a = a / count;
		}

		//convert RGB into brightness
		brightness = (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
	}
	
	switch (holesize) { 
		case 'fixed':
			//calculate mapped value of diameter
			var realD = (!inverted) ? convertToRange(brightness, [0, 255], [minS, maxS]) : convertToRange(brightness, [0, 255], [maxS, minS]);
			var approxD = 9999999999;
			//search for the closest size in our array
			for(var m=0; m<numberOfSizes; m++){
				approxD = (Math.abs(realD - sizes[m]) < Math.abs(realD - approxD))? sizes[m] : approxD;
			}
			D = approxD;
			break;
		
	    default: 
	    	//default is "range"
			//map brightness to diameter
			D = (!inverted) ? convertToRange(brightness, [0, 255], [minD, maxD]) : convertToRange(brightness, [0, 255], [maxD, minD]);    	
	    	break;
	}
	return D;
}

/* ************************ *
 * FUNCTIONS 				*
 * ************************ */

//activate fileselect
function onFileSelected(event) {
	var selectedFile = event.target.files[0];
	var reader = new FileReader();
	imgInputFocus = true;

	//changethe miniature image seen in the sidebar
	var imgtag = document.getElementById("input_img");
	imgtag.title = selectedFile.name;
	//create an offscreen image the same size as the orignal image
	//this is done bcs the sidebar image will be ade smaller to fit in the sidebar
	//this image will be used by the canvas to generate the pattern
	var canvasImage = $('<img id="canvasImage">').addClass("canvasImage")[0];
	//canvasImage.addClass("canvasImage");
	canvasImage.title = selectedFile.name;

	reader.onload = function(event) {
		$("#input_img_helptext").hide();
		imgtag.src = event.target.result;
		canvasImage.src = event.target.result;
		//as soon as the image has loaded completely, assign it to 'img' and refresh the canvas
		canvasImage.onload = function(event) {
			//store image in global variable
			img = canvasImage;
			
			//store full-size image on offscreen canvas
			OSCanvas.width = img.width;
			OSCanvas.height = img.height;
			OSctx.drawImage(img, 0, 0, img.width, img.height);
			
			//set document dimensions to image dimensions
			docW = img.width;
			$("#docW").val(docW);
			$("#docW").attr( "value", docW);
			docH = img.height;
			$("#docH").val(docH);
			$("#docH").attr( "value", docH);
			
			//get all the imagedata and put it in an array with each element being an array of the R/G/B/a value of that pixel
			var data = OSctx.getImageData(0, 0, img.width, img.height).data;
			//empty the pixels array
			pixels = [];
			//save a 2D array containing the RGBA value(i think?) of each pixel 
			for (var k = 0; k * 4 < data.length; k++) {
				pixels[k] = [data[k * 4], data[k * 4 + 1], data[k * 4 + 2], data[k * 4 + 3]];
			}
			
			//update 
			updateParameters()
			refresh();
			updateSeekerWindowVariables();
			
			//resize the scollable part of the menu
			var previewImg = $("#input_img");
			$("#scrollable_menu_wrapper").css("height",$( window ).height() - (46+previewImg.height()) );
		}
	};
	reader.readAsDataURL(selectedFile);
}

/**
 *Converts dimensions from document to image dimensions
 * 
 * @param float value The value to be converted
 * @return float The value in image dimensions 
 */
function docToImg(value){
	var docToImg = (img!=null) ? (img.width / docW) : 1;
	return Math.round(value*docToImg);
}

/**
 *Converts dimensions from image to document dimensions
 * 
 * @param float value The value to be converted
 * @return float The value in document dimensions 
 */
function imgToDoc(value){
	var imgToDoc = (img!=null) ? (docW / img.width) : 1;
	return value*imgToDoc;
}

/**
 * FUNCTION TO MAP VALUE TO A RANGE by Gaby aka G. Petrioli
 * 
 * @param
 * @return
 */
function convertToRange(value, srcRange, dstRange) {
	// value is outside source range return
	if (value < srcRange[0] || value > srcRange[1]) {
		return NaN;
	}

	var srcMax = srcRange[1] - srcRange[0], dstMax = dstRange[1] - dstRange[0], adjValue = value - srcRange[0];

	return (adjValue * dstMax / srcMax) + dstRange[0];
}

/*FUNCTION TO GET AVERAGE VALUE AROUND POINT IN AN AREA OF STEPX/STEPY */
function getAverage(posX, posY) {
	var R = 0;
	var G = 0;
	var B = 0;
	var a = 0;
	var count = 0;
	for ( i = Math.round(-stepX / 2); i < (stepX / 2); i++) {
		for ( j = Math.round(-stepY / 2); i < (stepY / 2); i++) {
			if (pixels[img.width * (posY - 1 + j) + posX + i]) {
				R += pixels[img.width * (posY - 1 + j) + posX + i][0];
				G += pixels[img.width * (posY - 1 + j) + posX + i][1];
				B += pixels[img.width * (posY - 1 + j) + posX + i][2];
				a += pixels[img.width * (posY - 1 + j) + posX + i][3];
				count++;
			}
		}
	}
	if (parseInt(count) > 0) {
		R = R / count;
		G = G / count;
		B = B / count;
		a = a / count;
	}
	return [R, G, B, a];
}

/**
 *Constrains value between min and max
 * 
 * @param float value
 * @param float minimum value
 * @param float maximum value
 * @return float the constrained value 
 */
function constrain(value,min,max){
	var returnValue = (value < min) ? min : (value > max) ? max : value;
	return returnValue;
}

/**
 * Updates all parameter 
 * 
 * @param
 * @return
 */
function updateParameters(){
	//UPDATE INPUT PARAMETERS
	
	//document size
	if(img!=null){
		if(docH != parseInt($("#docH").val())){
			//change size proportionally to uploaded image
			var factor = parseInt($("#docH").val()) / img.height;
			docW = Math.ceil(img.width*factor);
			docH = parseInt($("#docH").val());
		} else if(docW != parseInt($("#docW").val())){
			//change size proportionally to uploaded image
			var factor = parseInt($("#docW").val()) / img.width;
			docH = Math.ceil(img.height*factor);
			docW = parseInt($("#docW").val());
		} else{
			docW = parseInt($("#docW").val());
			docH = parseInt($("#docH").val());
		}
	} else{
		docW = parseInt($("#docW").val()) || "";
		docH = parseInt($("#docH").val()) || "";
	}
	
	$("#docW").val(docW);
	$("#docW").attr( "value", docW);
	
	$("#docH").val(docH);
	$("#docH").attr( "value", docH);
	
	//shape
	perforations = $("#perforationtype").val();
	ortho = ($("#gridstacking").val() == "ortho") ? true : false;
	
	//size
	holesize = $("#holesize").val();
	numberOfSizes = parseInt($("#numberOfSizes").val());
	
	sizes[0] = parseInt($("#s1").val());
	sizes[1] = parseInt($("#s2").val());
	sizes[2] = parseInt($("#s3").val());
	sizes[3] = parseInt($("#s4").val());
	sizes[4] = parseInt($("#s5").val());
	
	minS = Math.min.apply(null, sizes);
	maxS = Math.max.apply(null, sizes);
	
	minD = constrain(parseInt($("#minD").val()), 0, maxD);
	$("#minD").val(minD);
	$("#minD").attr( "value", minD);
	
	maxD = constrain(parseInt($("#maxD").val()), minD, capD);
	$("#maxD").val(maxD);
	$("#maxD").attr( "value", maxD);
	
	minMargin = constrain(parseInt($("#minMargin").val()), 0, capMargin);
	$("#minMargin").val(minMargin);
	$("#minMargin").attr( "value", minMargin);
	
	//draw options
	inverted = ($("#perforate").val() == "true") ? true : false;
	drawLimit = ($("#drawLimit").val() == "true") ? true : false;
	
	minDdraw = constrain(parseInt($("#minDdraw").val()), 0, maxDdraw);
	$("#minDdraw").val(minDdraw);
	$("#minDdraw").attr( "value", minDdraw);
	
	maxDdraw = constrain(parseInt($("#maxDdraw").val()), minDdraw, capD);
	$("#maxDdraw").val(maxDdraw);
	$("#maxDdraw").attr( "value", maxDdraw);
	
	
	//TOGGLE VISIBILITIES
	//handle visibility for holesize options
	$('.holesize_param').each(function() {
		$(this).hide();
	});
	switch (holesize) { 
		case 'fixed':
			$("#fixed_param").show();
			break;
		
	    default: 
	    	//default is "range"
	    	$("#range_param").show();
	    	break;
	    	
	}
	
	//handle visibility for n°holesizes
	var c = 0;
	$('.holesize_value').each(function() {
		var display = (c<numberOfSizes) ? "block" : "none";
		$(this).css("display", display);
		c++;	
	});
	
	//handle visibility for drawLimit
	var drawLimitDisplay = (drawLimit) ? "block" : "none";
	$("#display_range").css("display", drawLimitDisplay);
	
	
	//UPDATE DRAWING PARAMETERS
	stepX = (holesize=="range") ? (maxD + minMargin) : (maxS + minMargin);
	//if triangular stacking recalc stepY
	stepY = (ortho || perforations == "rectangles") ? stepX : Math.round(stepX * 0.86602540378);

	initialX = docToImg(stepX / 2);
	initialY = docToImg(stepY / 2);
	
	//conert to image diensions
	stepX = docToImg(stepX);
	stepY = docToImg(stepY);
}

