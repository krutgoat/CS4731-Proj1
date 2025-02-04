
function main() {

    // Retrieve <canvas> element
    let canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    let gl = WebGLUtils.setupWebGL(canvas, undefined);
    if (!gl) { //Check that the return value is not null.
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    let program = initShaders(gl, "vshader", "fshader");
    gl.useProgram(program);
    gl.viewport(0, 0, 400, 400); //Set up the viewport

    // global variables
    let defaultDims = [0, 0, canvas.width, canvas.height]
    let defaultLines = '#000000'
    let dims = [];
    let lines = [];
    let lineLength = 0;

    // retrieve SVG file & data
    document.getElementById('fileupload').addEventListener('change', handleSVGFiles);

    setView(dims);

    // handle and extract file information
    function handleSVGFiles(e) {
        let reader = readTextFile(e);  //The event from the event handler
        reader.onload = function() {
            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(reader.result, "image/svg+xml");
            dims = xmlGetViewbox(xmlDoc, defaultDims);       
            lines = xmlGetLines(xmlDoc, defaultLines);
            lineLength = lines[0].length;

            console.log("Extracted viewbox information: ", dims);
            console.log("Extracted line information: ", lines);

            // now, lines[0] is all the point info and lines[1] is color info
            setView(dims);
            //allocateBuffersAndDraw(lines[0], lines[1]);
            
            pushData(lines[0], "vPosition"); // allocate line buffers
            pushData(lines[1], "vColor"); // allocate color buffers
        }; 
    }
    

	gl.clearColor(0.0, 0.0, 0.0, 0.0); // Set clear color
	gl.clear(gl.COLOR_BUFFER_BIT); // Clear <canvas> by clearing the color buffer

	
    // setting up extents and viewport
    function setView(svgDims) {
        let projMatrix = ortho(svgDims[0], svgDims[2] + svgDims[0], svgDims[3] + svgDims[1], svgDims[1], -1, 1);
        let projMatrixLoc = gl.getUniformLocation(program, "projMatrix");
        gl.uniformMatrix4fv(projMatrixLoc, false, flatten(projMatrix));
    
    }

    function render() {

        // Clear <canvas> by clearing the color buffer
        gl.clear(gl.COLOR_BUFFER_BIT);
    
        // tranform matrix
        let dropMatrix = mult(
            translate(transNum, 0, 0),
            mult(
                translate(0, height, 0),
                rotateZ(rotNum)));
    
        let dropMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
        gl.uniformMatrix4fv(dropMatrixLoc, false, flatten(dropMatrix));
    
        shape();
        
        if(height > -1.8)	height = height - 0.005;
    
        gl.drawArrays(gl.LINES, 0, lineLength);
    
        requestAnimationFrame(render);
    }

}



// new simplified buffers function
function pushData(data, attName) {

	let buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);

	let attrib = gl.getAttribLocation(program, attName);
	gl.vertexAttribPointer(attrib, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(attrib);
}

// old buffers and drawing function
function allocateBuffersAndDraw(lines, colors) {
    let pBuffer = gl.createBuffer(); // create points buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(lines), gl.STATIC_DRAW);
    
    let vPosition = gl.getAttribLocation(program,  "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    let cBuffer = gl.createBuffer(); // create colors buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    
    let vColor = gl.getAttribLocation(program,  "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    // Draw a point
    gl.drawArrays(gl.LINES, 0, lines.length);
}