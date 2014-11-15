/*
 perforation script

 Thomas Van Bouwel - 2013
 */

/*GLOBAL VARIABLES*/
var X = 0;
var Y = 0;
var img = null;
var stepX = 20;
var stepY = 20;
var initialX = 10;
var initialY = 10;
var minD = 0;
var maxD = 8;
var minMargin = 3;
var inverted = false;
//rectangles or circles as perforations
var perforations = "circles";
//orthogonal grid or triangular grid
var ortho = true;
//pixel array
var pixels = new Array();
//main drawing canvas
var canvas;
//svg string
var svgString = "";

/* ************************ *
 * main refreshing function *
 * ************************ */
function refresh() {
	
	/*PREPARING THE CANVAS*/
	//offscreen (OS) canvas to store the original image as a reference to the generated pattern
	var OSCanvas = $('<canvas/>')[0];
	var OSctx = OSCanvas.getContext("2d");
	
	/*RESET SVG STRING*/
	svgString = "<svg width='"+img.width+"' height='"+img.height+"'>";

	/*DRAW*/
	//if an image was added, generate the pattern
	if (img != null) {
		//get the main canvas
		canvas = new fabric.Canvas('canvas');
		canvas.renderOnAddRemove = false;
		//store full-size image on offscreen canvas
		OSCanvas.width = img.width;
		OSCanvas.height = img.height;
		OSctx.drawImage(img, 0, 0, img.width, img.height);

		//resize canvas to image size
		//get width/height of parent div
		var W = $('#render_window').width();
		var H = $('#render_window').height();
		//set canvas to width/height of image
		$("#canvas").attr("width", img.width);
		$("#canvas").attr("height", img.height);
		//determine the origin of the generated image
		if (img.width > W && img.height > H) {
			//place canvas in the corner
			$("#canvas").css('left', 0);
			$("#canvas").css('top', 0);
		} else if (img.width > W && img.height < H) {
			//place canvas in the vertical center
			$("#canvas").css('left', 0);
			$("#canvas").css('top', 0 + H / 2 - img.height / 2 + 'px');
		} else if (img.width < W && img.height > H) {
			//place canvas in the horizontal center
			$("#canvas").css('left', 0 + W / 2 - img.width / 2 + 'px');
			$("#canvas").css('top', 0);
		} else {
			//place canvas in the center
			$("#canvas").css('left', 0 + W / 2 - img.width / 2 + 'px');
			$("#canvas").css('top', 0 + H / 2 - img.height / 2 + 'px');
		}
		
		if(!inverted){
			//draw black rectangle on main canvas
			var rect = new fabric.Rect({
			  left: X,
			  top: Y,
			  fill: 'black',
			  width: img.width,
			  height: img.height
			});
			
			//SVG
			svgString += "<rect width='"+img.width+"' height='"+img.height+"' style='fill:rgb(0,0,0);' />";
		} else{
			//draw white rectangle on main canvas
			var rect = new fabric.Rect({
			  left: X,
			  top: Y,
			  fill: 'white',
			  width: img.width,
			  height: img.height
			});
			
			//SVG
			svgString += "<rect width='"+img.width+"' height='"+img.height+"' style='fill:rgb(255,255,255);' />";
		}
		// "add" rectangle onto canvas
		canvas.add(rect);

		//update the seeker window on the preview img
		updateSeekerWindowVariables();
		updateSeekerWindow();

		//update all parameters
		stepX = maxD + minMargin;
		//if triangular stacking recalc stepY
		if (ortho || perforations == "rectangles") {
			stepY = maxD + minMargin;
		} else {
			stepY = Math.round(stepX * 0.86602540378);
		}
		initialX = Math.round(stepX / 2);
		initialY = Math.round(stepY / 2);

		//get all the imagedata and put it in an array with each element being an array of the R/G/B/a value of that pixel
		var data = OSctx.getImageData(0, 0, img.width, img.height).data;
		//empty the pixels array
		pixels = [];
		//save a 2D array containing the RGBA value(i think?) of each pixel 
		for (var k = 0; k * 4 < data.length; k++) {
			pixels[k] = [data[k * 4], data[k * 4 + 1], data[k * 4 + 2], data[k * 4 + 3]];
		}
		
		for (var i = 0; initialX + i * stepX < img.width; i += 1) {
			for (var j = 0; initialY + j * stepY < img.height; j += 1) {
				
				var posX = initialX + i * stepX;
				var posY = initialY + j * stepY;
				if ((j % 2 === 0) && !ortho) {
					posX += Math.round(stepX / 2);
				}
				//check if value exists
				if (pixels[img.width * (posY - 1) + posX]) {
					var red = pixels[img.width*(posY-1)+posX][0];
					var green = pixels[img.width*(posY-1)+posX][1];
					var blue = pixels[img.width*(posY-1)+posX][2];

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
					var brightness = (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
					//map brightness to diameter
					var D = (!inverted) ? convertToRange(brightness, [0, 255], [minD, maxD]) : convertToRange(brightness, [0, 255], [maxD, minD]);
					var fillColor = (!inverted) ? "white" : "black";
					var strokeColor = (!inverted) ? "black" : "white";

					if (perforations == "circles") {
						var circle = new fabric.Circle({
						  radius: D/2, fill: fillColor, left: X + posX-D/2, top: Y + posY-D/2, stroke: strokeColor, strokeWidth: 1
						});
						canvas.add(circle);
						
						//SVG
						svgString += "<circle cx='"+(X + posX)+"' cy='"+(Y + posY)+"' r='"+(D/2)+"' stroke='"+strokeColor+"' stroke-width='1' fill='"+fillColor+"' />";
						
					} else if(perforations == "rectangles"){
						var rect = new fabric.Rect({
						  left: X + posX-D/2,
						  top: Y + posY-D/2,
						  fill: fillColor,
						  width: D,
						  height: D,
						  stroke: strokeColor, 
						  strokeWidth: 1
						});
						
						canvas.add(rect);
						
						//SVG
						svgString += "<rect x='"+(X + posX-D/2)+"' y='"+(Y + posY-D/2)+"' width='"+D+"' height='"+D+"'  style='fill:"+fillColor+";stroke-width:1;stroke:"+strokeColor+"' />";
					}
				}
			}
		}
		canvas.renderAll();
		
		/*CLOSE SVG STRING*/
		svgString += "</svg>";
	}
}

/*FUNCTION TO MAP VALUE TO A RANGE by Gaby aka G. Petrioli*/
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
			console.log(img.width * (posY - 1 + j) + posX + i);
			if (pixels[img.width * (posY - 1 + j) + posX + i]) {
				R += pixels[img.width * (posY - 1 + j) + posX + i][0];
				G += pixels[img.width * (posY - 1 + j) + posX + i][1];
				B += pixels[img.width * (posY - 1 + j) + posX + i][2];
				a += pixels[img.width * (posY - 1 + j) + posX + i][3];
				count++;
				console.log("ok");
			}
		}
	}
	if (parseInt(count) > 0) {
		console.log("ok");
		R = R / count;
		G = G / count;
		B = B / count;
		a = a / count;
	}
	return [R, G, B, a];
}

/* ***************************** *
 * ON PAGELOAD 					 *
 * ***************************** */

$(document).ready(function() {
	//activate sliders
	$("#minD").bind("slider:changed", function(event, data) {
		minD = data.value;
	});

	$("#maxD").bind("slider:changed", function(event, data) {
		maxD = data.value;
	});

	$("#minMargin").bind("slider:changed", function(event, data) {
		minMargin = data.value;
	});
	
	/*
	 * add eventlistener to all parameters and update them
	 */
	$( ".input" ).change(function() {
  		updateParameters();
	});
	updateParameters();
	
});

/**
 *Updates all parameter 
 */
function updateParameters(){
	perforations = $("#perforationtype").val();
	ortho = ($("#gridstacking").val() == "ortho") ? true : false;
	inverted = ($("#perforate").val() == "true") ? true : false;
}

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
			img = canvasImage;
			refresh();
			updateSeekerWindowVariables();
		}
	};
	reader.readAsDataURL(selectedFile);
}

/* ***************************** *
* SEEKER WINDOW ON PREVIEW IMG   *
* ****************************** */

/*variables big canvas  */
/* s stands for 'seeker'*/
//height & width canvas
var Hs = 0;
var Ws = 0;
//height & width screen
var As = 0;
var Bs = 0;
//distance scrolled in x&y direction
var Xs = 0;
var Ys = 0;
/*variables little preview canvas*/
//height & width previewimage
var hs = 0;
var ws = 0;
//height & width seekerwindow
var as = 0;
var bs = 0;
//displacement seeker window in x&y direction
var xs = 0;
var ys = 0;
//variables updated?
var varUpdated = false;

function updateSeekerWindowVariables() {
	if (img != null) {
		Hs = canvas.getHeight();
		Ws = canvas.getWidth();
	
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

function updateSeekerWindow() {
	if (varUpdated) {
		updateSeekerWindowVariables()

		var canvas_seeker = document.getElementById("canvas_seeker");
		var ctx = canvas_seeker.getContext("2d");

		//set canvas to width/height of image
		$("#canvas_seeker").attr("width", ws);
		$("#canvas_seeker").attr("height", hs);

		console.log("1");
		console.log("2");

		ctx.fillStyle = 'rgba(255,255,255,.5)';
		ctx.fillStyle = 'rgba(0,0,0,.6)';
		// Draw some rectangles.
		ctx.fillRect(0, 0, ws, hs);
		ctx.clearRect(xs, ys, bs, as);
		ctx.strokeStyle = 'rgb(255,255,255)';
		//ctx.strokeRect(xs, ys, bs, as);

		//console.log(H + " " + W + " " + A + " " + B + " " + X + " " + Y + "||" + h + " " + w + " " + a + " " + b + " " + x + " " + y);
	}
};

/* ***************************** *
 * download image manager         *
 * ****************************** */

window.onload = function() {
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
		this.href = "data:application/octet-stream;charset=utf-8;base64,"+btoa(svgString);
		}
	};
};
