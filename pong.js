var gl = null,
    canvas = null,
    glProgram = null,
    fragmentShader = null,
    vertexShader = null;
var vertexPositionAttribute = null,
    cubeVerticeBuffer = null;
var vertexColorAttribute = null,
    cubeColorBuffer = null,
    cubeIndicesBuffer = null;
var diskIndicesBuffer = null;
var mvMatrix = mat4.create();

goInterval = null;
masterPong = true;
pongRunning = false;
pongStarted = true;

var mov_axis = 'y';

const DX_INIT = 0.1;
const DX_MAX = 0.58;
const DX_INCR = 0.03;

const DY_MAX = 0.22;
const DY_HIT_INCR = 0.31;

const MAX_BAR_POS = 3.7;
const DISK_FACES = 15;

var playerA = {
    posX: -6.0,
    posY: 0.0,
    color: {r:1, g:0, b:0},
    score: 0
}

var playerB = {
    posX: 6.0,
    posY: 0.0,
    color: {r:0, g:0, b:1},
    score: 0
}

var disk = {
    posX: 0.0,
    posY: 0.0,
    dX: DX_INIT,
    dY: 0.0,
    color: {r:1, g:1, b:1}
}

window.onload = function(){
    window.addEventListener('keydown',callbackOnKeyDown);
    initWebGL();
    
    resetDisk();
}
function initWebGL() {
    initColorBarSelection();
    canvas = document.getElementById("my-canvas");
    try {
        gl = canvas.getContext("webgl") ||
            canvas.getContext("experimental-webgl");
    } catch (e) {}
    if (gl) {
        initShaders();
        setupBuffers();
        getUniforms();
        $(document).keydown(handleKeyEvent);
        (function animLoop() {
            setupWebGL();
            drawScene();
            requestAnimationFrame(animLoop, canvas);
        })();
    } else {
        alert("Não suporta WebGL.");
    }
}

function initColorBarSelection() {
    function refreshSwatch() {
        playerA.color.r = $( "#redBar" ).slider("value")/255,
        playerA.color.g = $( "#greenBar" ).slider("value")/255,
        playerA.color.b = $( "#blueBar" ).slider("value")/255;
    }

    $( "#redBar, #greenBar, #blueBar" ).slider({
      orientation: "horizontal",
      range: "min",
      max: 255,
      value: 127,
      slide: refreshSwatch,
      change: refreshSwatch
    });
    $( "#redBar" ).slider( "value", 0 );
    $( "#greenBar" ).slider( "value", 0 );
    $( "#blueBar" ).slider( "value", 255 );
}

function handleKeyEvent(ev) {
    var ymov = 0.3;
    if (mov_axis=='y'){
        if (ev.which == 38){
            playerA.posY += ymov;
            if (playerA.posY > MAX_BAR_POS) playerA.posY = MAX_BAR_POS;
        }else if (ev.which == 40) {
            playerA.posY -= ymov;
            if (playerA.posY < -MAX_BAR_POS) playerA.posY = -MAX_BAR_POS;
        }
    } else {
        if (ev.which == 37){
            playerA.posY += ymov;
            if (playerA.posY > MAX_BAR_POS) playerA.posY = MAX_BAR_POS;
        }else if (ev.which == 39) {
            playerA.posY -= ymov;
            if (playerA.posY < -MAX_BAR_POS) playerA.posY = -MAX_BAR_POS;
        }
    }

    if (mov_axis=='y'){
        if (ev.which == 87){
            playerB.posY += ymov;
            if (playerB.posY > MAX_BAR_POS) playerB.posY = MAX_BAR_POS;
        }else if (ev.which == 83) {
            playerB.posY -= ymov;
            if (playerB.posY < -MAX_BAR_POS) playerB.posY = -MAX_BAR_POS;
        }
    } else {
        if (ev.which == 87){
            playerB.posY += ymov;
            if (playerB.posY > MAX_BAR_POS) playerB.posY = MAX_BAR_POS;
        }else if (ev.which == 83) {
            playerB.posY -= ymov;
            if (playerB.posY < -MAX_BAR_POS) playerB.posY = -MAX_BAR_POS;
        }
    }
}

function handleMouseEvent(event) {
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;

    if (mov_axis=='y'){
        playerA.posY = MAX_BAR_POS * (1- y/(canvas.height/2));
        if (playerA.posY > MAX_BAR_POS) playerA.posY = MAX_BAR_POS;
        if (playerA.posY < -MAX_BAR_POS) playerA.posY = -MAX_BAR_POS;
    } else {
        playerA.posY = MAX_BAR_POS * (1- x/(canvas.width/2));
        if (playerA.posY > MAX_BAR_POS) playerA.posY = MAX_BAR_POS;
        if (playerA.posY < -MAX_BAR_POS) playerA.posY = -MAX_BAR_POS;
    }
}


function updateStatusPong(msg) {
    if (!masterPong && msg.disk){
        disk.posX = -msg.disk.x;
        disk.posY = msg.disk.y;
        if (Math.abs(disk.posX) === 5.40000000001)
            iluminateDisk();
    }
    playerB.posY = msg.player.y;
    playerB.color = msg.player.color;
}

function updateScore(msg) {
    window.pongRunning = false;
    if (msg.score.you > playerA.score){
       newPoint(playerA);
    }else if (msg.score.me > playerB.score){
       newPoint(playerB);
    }
}

function newPoint(player) {
    player.score += 1;
    if(player.score >= 2){
        let vencedor = playerA.score> playerB.score ? '1': '2';

		let resultado = document.getElementById('Resultado');
		resultado.innerHTML = "Jogador " + vencedor + " Vence !!";

		playerA.score = 0;
		playerB.score = 0;
		let dica = document.getElementById('Dica');
		dica.innerHTML = "'Espaço' para recomeçar";
    }else{
        newIntervalGo(1);
    }

    $('#playerA').html(playerA.score);
    $('#playerB').html(playerB.score);
    resetDisk();
}

function callbackOnKeyDown(event){

if(event.keyCode == 32){


    if(playerA.score == 0 && playerB.score == 0){
        let resultado = document.getElementById('Resultado');
        resultado.innerHTML = "";

        let dica = document.getElementById('Dica');
        dica.innerHTML = "";
        window.pongRunning = true;
    }
}
}

function newIntervalGo(timeLeft) {
    if (goInterval) clearInterval(goInterval);
    goInterval = setInterval(function () {
        if (timeLeft > 0){
            $('#timeLeft').html(timeLeft);
        } else {
            clearInterval(goInterval);
            goInterval = null;
            $('#timeLeft').html('GO!');
            if (window.pongStarted)
                window.pongRunning = true;
        }
        timeLeft--;
    }, 1000);
}

function setupWebGL() {
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.viewport(0, 0, canvas.width, canvas.height);
}

function initShaders() {
    var fs_source = document.getElementById('shader-fs').innerHTML,
        vs_source = document.getElementById('shader-vs').innerHTML;
    vertexShader = makeShader(vs_source, gl.VERTEX_SHADER);
    fragmentShader = makeShader(fs_source, gl.FRAGMENT_SHADER);
    glProgram = gl.createProgram();
    gl.attachShader(glProgram, vertexShader);
    gl.attachShader(glProgram, fragmentShader);
    gl.linkProgram(glProgram);
    if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program.");
    }
    gl.useProgram(glProgram);
}

function makeShader(src, type) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("Error compiling shader: " + gl.getShaderInfoLog(shader));
    }
    return shader;
}

function getDiskAttrAndIndices(slices) {
    var attrs = [];
    var indices = [];
    var colorDown = {r:0.5, g:0.5, b:0.5};
    var colorUp = {r:1.0, g:1.0, b:1.0};

    attrs.push(0.0, 0.0, 1.0, colorUp.r, colorUp.g, colorUp.b);
    attrs.push(0.0, 0.0,-1.0, colorDown.r, colorDown.g, colorDown.b);
    for (var i = 0; i<slices; i++) {
        var angle = i*2*Math.PI/slices;
        var x = Math.cos(angle);
        var y = Math.sin(angle);
        attrs.push(x, y, 1, colorUp.r, colorUp.g, colorUp.b);
        attrs.push(x, y, 1, colorDown.r, colorDown.g, colorDown.b);
        attrs.push(x, y, -1, colorDown.r, colorDown.g, colorDown.b);
        if (i === 0) continue
        var prev_top_a = 2+(i-1)*3, prev_top_b = 3+(i-1)*3, prev_bot = 4+(i-1)*3;
        var curr_top_a = 2+(i  )*3, curr_top_b = 3+(i  )*3, curr_bot = 4+(i  )*3;
        indices.push(0, prev_top_a, curr_top_a);
        indices.push(prev_top_b, prev_bot, curr_top_b);
        indices.push(prev_bot, curr_top_b, curr_bot);
        indices.push(1, prev_bot, curr_bot);
        if (i == slices-1) {
            
            indices.push(0, 2, curr_top_a);
            indices.push(3, 4, curr_top_b);
            indices.push(4, curr_top_b, curr_bot);
            indices.push(1, 4, curr_bot);
        }
    }
    return {'indices': indices, 'attr': attrs}
}

function setupBuffers() {
    var cubeAttributes = [
        -1.0,-1.0,-1.0,     0.0,0.0,0.0,
         1.0,-1.0,-1.0,     0.0,0.0,0.0,
         1.0, 1.0,-1.0,     0.0,0.0,0.0,
        -1.0, 1.0,-1.0,     0.0,0.0,0.0,

        -1.0,-1.0, 1.0,     1.0,1.0,1.0,
         1.0,-1.0, 1.0,     1.0,1.0,1.0,
         1.0, 1.0, 1.0,     1.0,1.0,1.0,
        -1.0, 1.0, 1.0,     1.0,1.0,1.0,

        -1.0,-1.0,-1.0,     0.5,0.5,0.5,
        -1.0, 1.0,-1.0,     0.5,0.5,0.5,
        -1.0, 1.0, 1.0,     0.5,0.5,0.5,
        -1.0,-1.0, 1.0,     0.5,0.5,0.5,

         1.0,-1.0,-1.0,     0.5,0.5,0.5,
         1.0, 1.0,-1.0,     0.5,0.5,0.5,
         1.0, 1.0, 1.0,     0.5,0.5,0.5,
         1.0,-1.0, 1.0,     0.5,0.5,0.5,

        -1.0,-1.0,-1.0,     0.5,0.5,0.5,
        -1.0,-1.0, 1.0,     0.5,0.5,0.5,
         1.0,-1.0, 1.0,     0.5,0.5,0.5,
         1.0,-1.0,-1.0,     0.5,0.5,0.5,

        -1.0, 1.0,-1.0,     0.5,0.5,0.5,
        -1.0, 1.0, 1.0,     0.5,0.5,0.5,
         1.0, 1.0, 1.0,     0.5,0.5,0.5,
         1.0, 1.0,-1.0,     0.5,0.5,0.5,
    ];
    cubeAttributesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeAttributesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeAttributes), gl.STATIC_DRAW);

    var cubeIndices = [
        0, 1, 2,
        0, 2, 3,

        4, 5, 6,
        4, 6, 7,

        8, 9, 10,
        8, 10, 11,

        12, 13, 14,
        12, 14, 15,

        16, 17, 18,
        16, 18, 19,

        20, 21, 22,
        20, 22 ,23
    ];
    cubeIndicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);

    var disk = getDiskAttrAndIndices(DISK_FACES);
    diskAttributesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, diskAttributesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(disk.attr), gl.STATIC_DRAW);
    diskIndicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, diskIndicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(disk.indices), gl.STATIC_DRAW);

    vertexPositionAttribute = gl.getAttribLocation(glProgram, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute);

    vertexColorAttribute = gl.getAttribLocation(glProgram, "aVertexColor");
    gl.enableVertexAttribArray(vertexColorAttribute);
}

function resetDisk() {
    disk.posX = 0;
    disk.posY = 0;
    disk.dY = 0;
    disk.dX = DX_INIT;
}

function checkDiskLimits() {
    if (disk.dY > DY_MAX)  disk.dY = DY_MAX;
    if (disk.dY < -DY_MAX) disk.dY = -DY_MAX;
    if (disk.dX > DX_MAX)  disk.dX = DX_MAX;
    if (disk.dX < -DX_MAX) disk.dX = -DX_MAX;
}

function iluminateDisk() {
    disk.color.b = 0
    setTimeout(function () {disk.color.b = 1}, 200);
}

function calculateDiskPosition(delta) {
    disk.posX += disk.dX*delta;
    disk.posY += disk.dY*delta;

    if (Math.abs(disk.posX) > 7) {
        pongRunning = false;
        if (disk.posX < 7) newPoint(playerB);
        else newPoint(playerA);
        var objToSend = {
            'type': 'update_score',
            'score': {'you': playerB.score, 'me': playerA.score}
        }
    }

    if (disk.posY > 4.8 || disk.posY < -4.8) {
        disk.posY -= disk.dY;
        disk.dY = -disk.dY;
    }

    if (disk.posX > 5.4 && disk.posX < 6.4 && (playerB.posY+1.5)>(disk.posY-0.4) && (playerB.posY-1.5)<(disk.posY+0.4)){
        disk.dX = -Math.abs(disk.dX);
        disk.posX = 5.40000000001;
        disk.dY += (disk.posY-playerB.posY)/1.9*DY_HIT_INCR;
        disk.dX -= DX_INCR;
        checkDiskLimits();
    }

    if (disk.posX < -5.4 && disk.posX > -6.4 && (playerA.posY+1.5)>(disk.posY-0.4) && (playerA.posY-1.5)<(disk.posY+0.4)){
        disk.dX = Math.abs(disk.dX);
        disk.posX = -5.40000000001;
        disk.dY += (disk.posY-playerA.posY)/1.9*DY_HIT_INCR;
        disk.dX += DX_INCR;
        checkDiskLimits();
    }
}

function moveTestPlayer() {
    playerA.posY = disk.posY + Math.random()*(-1.0-1.0) + 1.0;
}

var lastUpdate = 0;
function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var time =  Date.now();
    var delta = 1;
    if (lastUpdate){
        delta = 30*(time-lastUpdate)/1000;
        if (delta > 2) console.log(masterPong, delta);
    }
    lastUpdate = time;
    if (window.pongStarted && window.pongRunning && window.masterPong){
        calculateDiskPosition(delta);
    }

    bindCubeBuffers();
    drawBarPlayer(playerA);
    drawBarPlayer(playerB);
    drawWall(-5.4);
    drawWall(5.4);
    drawBoard();

    drawDisk();
}

function bindCubeBuffers() {
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeAttributesBuffer);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 4*(3+3), 0);
    gl.vertexAttribPointer(vertexColorAttribute, 3, gl.FLOAT, false, 4*(3+3), 3*4);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndicesBuffer);
}

function drawWall(ypos) {
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0, ypos, -10]);
    mat4.scale(mvMatrix, [7, 0.2, 0.2]);
    gl.uniformMatrix4fv(glProgram.uMVMatrix, false, mvMatrix);
    gl.uniform3f(glProgram.ucolor, 1, 1, 1);
    gl.drawElements(gl.TRIANGLES, 6*6, gl.UNSIGNED_SHORT, 0);
}

function drawBoard() {
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0, 0, -12.0]);
    mat4.scale(mvMatrix, [7, 5.6, 1.8]);


    // var texture = gl.createTexture();   // Create a texture object
    // var image = new Image();  // Create the image object
    // image.src = "branco.png";
    // loadTexture(image, texture);

    // // Tell the browser to load an image

    // gl.activeTexture(gl.TEXTURE0);
    // gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniformMatrix4fv(glProgram.uMVMatrix, false, mvMatrix);
    gl.uniform3f(glProgram.ucolor, 0.5, 0.5, 0.5);
    gl.drawElements(gl.TRIANGLES, 6*6, gl.UNSIGNED_SHORT, 0);
}

function loadTexture(image, texture) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);


    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.bindTexture(gl.TEXTURE_2D, null);
  }

function drawBarPlayer(player) {
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [player.posX, player.posY, -9.9]);
    mat4.scale(mvMatrix, [0.2, 1.5, 0.3]);
    gl.uniformMatrix4fv(glProgram.uMVMatrix, false, mvMatrix);
    gl.uniform3f(glProgram.ucolor, player.color.r, player.color.g, player.color.b);
    gl.drawElements(gl.TRIANGLES, 6*6, gl.UNSIGNED_SHORT, 0);
}

function drawDisk() {
    gl.bindBuffer(gl.ARRAY_BUFFER, diskAttributesBuffer);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 4*(3+3), 0);
    gl.vertexAttribPointer(vertexColorAttribute, 3, gl.FLOAT, false, 4*(3+3), 3*4);

    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [disk.posX, disk.posY, -10.0]);
    mat4.scale(mvMatrix, [0.4, 0.4, 0.3]);
    gl.uniformMatrix4fv(glProgram.uMVMatrix, false, mvMatrix);

    gl.uniform3f(glProgram.ucolor, disk.color.r, disk.color.g, disk.color.b);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, diskIndicesBuffer);
    gl.drawElements(gl.TRIANGLES, 12*DISK_FACES, gl.UNSIGNED_SHORT, 0);
}

function getUniforms() {
    glProgram.uMVMatrix = gl.getUniformLocation(glProgram, "uMVMatrix");
    glProgram.uPMatrix = gl.getUniformLocation(glProgram, "uPMatrix");
    glProgram.ucolor = gl.getUniformLocation(glProgram, "uColor");
    var pMatrix = mat4.create();
    var ratio = canvas.width / canvas.height;
    mat4.perspective(60, ratio, 0.1, 100, pMatrix);
    mat4.translate(pMatrix, [0.0, 7.0, -3.0]);
    mat4.rotate(pMatrix, 0.7, [-1.0, 0.0, 0.0]);

    gl.uniformMatrix4fv(glProgram.uPMatrix, false, pMatrix);
}

function stopWebGl() {
    masterPong = false;
    pongRunning = false;
    pongStarted = false;

    playerA.score = 0;

    playerB.posY = 0.0;
    playerB.color = {r:0, g:0, b:1};
    playerB.score = 0;
    $('#localScore').html('0');
    $('#remoteScore').html('0');
    clearInterval(goInterval);
    $('#timeLeft').html('Wait...');

    resetDisk();
}
