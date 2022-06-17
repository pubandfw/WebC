/**
 * This web c language is based on 2 programs 
 *
 * 1. Blockly Apps: Turtle Grphics by fraser@google.com (Neil Fraser)
 * 2. qb.js: Quick Basic JavaScript by Steve Hanov
 *
 * and modified to implement interactive behaviour of web c language
 *
 * Sang Cho (sangcho@cju.ac.kr)
 * Cheongju University.
 * 2014. September. 1st.
 */
'use strict';
/**
 * Create a namespace for the application.
 */
var Webc = {};
// Supported languages.
BlocklyApps.LANGUAGES = ['en'];
BlocklyApps.LANG = BlocklyApps.getLang();

document.write('<script type="text/javascript" src="generated/' +
               BlocklyApps.LANG + '.js"></script>\n');

Webc.HEIGHT = 480;
Webc.WIDTH = 480;

/**
 * PID of animation task currently executing.
 */
Webc.pid = 0;

/**
 * Should the turtle be drawn?
 */
Webc.speed = 'Normal';

// map of functions in this project
Webc.funMap = null;

Webc.funMap2 = null;

// for checkBox
Webc.uiBox = [];

/**
 * Initialize Blockly and the Webc.  Called on page load.
 */
Webc.init = function () {
    BlocklyApps.init();

    var blocklyDiv = document.getElementById('blockly');
    var visualization = document.getElementById('visualization');
    var onresize = function(e) {
        var top = visualization.offsetTop;
        blocklyDiv.style.top = Math.max(10, top - window.pageYOffset) + 'px';
        blocklyDiv.style.left = '500px'; // rtl ? '10px' : '500px';
        blocklyDiv.style.width = (window.innerWidth - 520) + 'px';
    };
    window.addEventListener('scroll', function() {
        onresize();
        Blockly.fireUiEvent(window, 'resize');
    });
    window.addEventListener('resize', onresize);
    onresize();

    window.addEventListener('keydown', Webc.onKeyDown, true);

    var toolbox = document.getElementById('toolbox');
    Blockly.inject(document.getElementById('blockly'),
        {path: '../../',
        rtl: false,
        toolbox: toolbox,
        trashcan: true});

    Webc.INFINITE_LOOP_TRAP = '  BlocklyApps.checkTimeout(%1);\n';

    // Add to reserved word list: API, local variables in execution evironment
    // (execute) and the infinite loop detection function.
    Webc.RESERVED_WORDS_ = '';
    Webc.addReservedWords('Turtle,code');

    window.addEventListener('beforeunload', function(e) {
        if (Blockly.mainWorkspace.getAllBlocks().length > 2) {
            e.returnValue = BlocklyApps.getMsg('webc_unloadWarning');  // Gecko.
            return BlocklyApps.getMsg('webc_unloadWarning');  // Webkit.
        }
        return null;
    });

    //BlocklyApps.loadBlocks(defaultXml);
    Webc.startblock = Blockly.Block.obtain(Blockly.mainWorkspace, 'webc_start');
    Webc.startblock.initSvg();
    Webc.startblock.render();
    Webc.startblock.setDeletable(false);

    var startXmlDom = Blockly.Xml.workspaceToDom(Blockly.getMainWorkspace());
    Webc.startXmlText = Blockly.Xml.domToText(startXmlDom);

    Webc.ctxDisplay = document.getElementById('display').getContext('2d');
    Webc.ctxScratch = document.getElementById('scratch').getContext('2d');
    Webc.ctxArrays = document.getElementById('arrays').getContext('2d');
    Webc.ctxVariables = document.getElementById('variables').getContext('2d');
    Webc.ctxScratch2 = document.getElementById('scratch2').getContext('2d');

    Webc.ctxVariables.canvas.addEventListener('mousedown', Webc.getPosition, false);

    Webc.canvas = document.getElementById('display');
    Webc.canvas.tabIndex = 0;
    Webc.interval = 0;
    Webc.cursorEnabled = false;
    Webc.cusorShown = false;
    Webc.cursorBackground = null;

    Webc.hasFocus = false;
    Webc.inputMode = false;
    Webc.onInputDone = null;
    Webc.inputStr = null;
    Webc.inputPos = 0;
    Webc.x_ = 0;
    Webc.y_ = 0;
    Webc.done = false;

    // VirtualMachine
    Webc.vm = new VirtualMachine();

    BlocklyApps.bindClick('runButton', Webc.runButtonClick);
    BlocklyApps.bindClick('resetButton', Webc.resetButtonClick);
    BlocklyApps.bindClick('screenButton', Webc.screenButtonClick);
    BlocklyApps.bindClick('arrayButton', Webc.arrayButtonClick);

    Webc.reset();
    Webc.funMap2 = {};
    Webc.instructions = null;
    Webc.allVariables = null;
    Webc.varList = null;
    Webc.allList = null;

    Webc.expandProblems();
 
    Webc.uiBox = [];
    Webc.varMap = {};
    Webc.ckbox = new CheckBox(32, 12);
    Webc.uiBox.push(Webc.ckbox);
    Webc.ckbox.update(Webc.ctxScratch2, true);
    // Lazy-load the syntax-highlighting.
    window.setTimeout(BlocklyApps.importPrettify, 1);
};

window.addEventListener('load', Webc.init);

/**
 * Reset the turtle to the start position, clear the display, and kill any
 * pending tasks.
 */
Webc.reset = function () {
    var runButton;
    // Starting location and heading of the Webc.
    Webc.x = 0; // Webc.HEIGHT / 2;
    Webc.y = 11; // Webc.WIDTH / 2;
    Webc.heading = 90;
    Webc.penDownValue = true;
    // Webc.speed = 'Normal';

    Webc.done = true;
    Webc.vm.suspended = false;
    Webc.inputMode = false;
    Webc.enableCursor(false);
    Webc.cursor(true);

    // Clear the display.
    Webc.ctxScratch.canvas.width = Webc.ctxScratch.canvas.width;
    Webc.ctxScratch.strokeStyle = '#000000';
    Webc.ctxScratch.fillStyle = '#000000';
    Webc.ctxScratch.lineWidth = 1;
    Webc.ctxScratch.lineCap = 'round';
    Webc.ctxScratch.font = 'normal 8pt Courier New';

    Webc.display();

    // Clear the Arrays canvas
    Webc.ctxArrays.canvas.width = Webc.ctxScratch.canvas.width;
    Webc.ctxArrays.strokeStyle = '#000000';
    Webc.ctxArrays.fillStyle = '#000000';
    Webc.ctxArrays.lineWidth = 1;
    Webc.ctxArrays.lineCap = 'round';
    Webc.ctxArrays.font = 'normal 8pt Courier New';

    Webc.display2();
    Webc.display();

    // Kill any task.
    if (Webc.pid) {
        window.clearTimeout(Webc.pid);
    }
    Webc.pid = 0;
    Webc.varMap = {};

    runButton = document.getElementById('runButton');
    runButton.disabled = false;
    runButton.style.display = 'inline';
};

/**
 * Copy the scratch canvas to the display canvas. Add a turtle marker.
 */
Webc.display = function () {
    Webc.ctxDisplay.globalCompositeOperation = 'copy';
    Webc.ctxDisplay.drawImage(Webc.ctxScratch.canvas, 0, 0);
    Webc.ctxDisplay.globalCompositeOperation = 'source-over';
    // Draw the Webc.
    Webc.ctxDisplay.strokeStyle = Webc.ctxScratch.strokeStyle;
    Webc.ctxDisplay.fillStyle = "#aaaaaa";
    Webc.ctxDisplay.fillRect( Webc.x, Webc.y-8, 6, 8);

    Webc.display3();
};

/**
 * Copy the scratch canvas to the display canvas. Add a turtle marker.
 */
Webc.display2 = function () {
    Webc.ctxDisplay.globalCompositeOperation = 'copy';
    Webc.ctxDisplay.drawImage(Webc.ctxArrays.canvas, 0, 0);
    Webc.ctxDisplay.globalCompositeOperation = 'source-over';
};

Webc.display3 = function () {
    Webc.ctxVariables.globalCompositeOperation = 'copy';
    Webc.ctxVariables.drawImage(Webc.ctxScratch2.canvas, 0, 0);
    Webc.ctxVariables.globalCompositeOperation = 'source-over';
    // Draw the Webc.  
};

/*
 * Click the run button.  Start the program.
 */
Webc.runButtonClick = function () {
    var runButton = document.getElementById('runButton');
    runButton.disabled = true;
    runButton.style.display = 'none';

    Webc.funMap = {};
    Webc.instructions = null;
    Webc.allVariables = null;
    Webc.varList = null;
    Webc.allList = null;
    Webc.oneList = [];
    Webc.twoList = [];

    // Webc.expandProblems();
    Webc.vm.reset_('_main_');
    Webc.workspaceToCode(Webc.startblock);
    Webc.addVarMap();
    // alert(JSON.stringify(Webc.instructions));
    // Webc.vm.run(Webc.instructions)

    Webc.instructions = Webc.funMap['_main_'].instructions;
    Webc.allVariables = Webc.funMap['_main_'].allVariables;
    Webc.varMap = Webc.funMap['_main_'].varMap;
    Webc.varList = Webc.funMap['_main_'].varList;
    Webc.allList = Webc.funMap['_main_'].allList;

    Webc.vm.reset(Webc.instructions);
    //Webc.vm.reset_();
    Webc.done = false;
    Webc.pid = window.setTimeout(Webc.nextStep, 20);
};

Webc.enableRunButton = function () {
    var runButton = document.getElementById('runButton');
    runButton.disabled = false;
};

/**
 * Click the reset button.  Reset the Webc.
 */
Webc.resetButtonClick = function () {
    Webc.reset();
};

/**
 * Click the screen button.  switch to console display.
 */
Webc.screenButtonClick = function () {
    if (Webc.vm.suspended) {
        Webc.vm.resume();
    }
    Webc.display();
};


/**
 * Click the array button.  switch to array display.
 */
Webc.arrayButtonClick = function () {
    Webc.display2();
};

/**
 * run instruction one by one until all is done. (for showing progress and highlight)
 */
Webc.nextStep = function () {
    // All tasks should be complete now.  Clean up the PID list.
    var id,
        block,
        timeout = (Webc.speed === 'Normal') ? 2 : 
                  ((Webc.speed === 'Slow') ? 100 : 1000);
    Webc.pid = 0;
    if (Webc.done) {
        return;
    }
    // id is block id of instruction just executed.
    id = Webc.vm.runOneInstruction();
    // waiting for keyboard input
    // after keyboard input is done 
    // resume is handling after input continuation.
    if (Webc.vm.suspended) {
        Blockly.mainWorkspace.traceOn(true);
        Blockly.mainWorkspace.highlightBlock(id);
        return;
    // at the end of instructions id becomes null to indicate end of program.
    } else if (id === null) {
        // show runButton again.
        var runButton = document.getElementById('runButton');
        runButton.disabled = false;
        runButton.style.display = 'inline';

        Webc.done = true;
        Webc.vm.suspended = false;
        Webc.inputMode = false;
        Webc.enableCursor(false);
        Webc.cursor(true);

        return;
    // for next insturction setTimeout for nextStep.
    } else {
        Blockly.mainWorkspace.traceOn(true);
        Blockly.mainWorkspace.highlightBlock(id);

        Webc.pid = window.setTimeout(Webc.nextStep, timeout);
    }
};

// keyboard input handling
Webc.toggleCursor = function() {
    Webc.cursor(!Webc.cursorShown);
};

Webc.cursor = function(show) {
    if (show === Webc.cursorShown) {
        return;
    }

    if (show) {
        // Make the turtle the colour of the pen.
        Webc.ctxDisplay.strokeStyle = Webc.ctxScratch.strokeStyle;
        Webc.ctxDisplay.fillStyle = "#aaaaaa";
        Webc.ctxDisplay.fillRect( Webc.x, Webc.y-8, 6, 8);
    } else {
        // Make the turtle the colour of the pen.
        Webc.ctxDisplay.strokeStyle = Webc.ctxScratch.strokeStyle;
        Webc.ctxDisplay.fillStyle = "#ffffff";
        Webc.ctxDisplay.fillRect( Webc.x, Webc.y-8, 6, 8);
    }
    Webc.cursorShown = show;
};

Webc.enableCursor = function(enabled) {
    if (enabled && !Webc.cursorEnabled) {
        Webc.interval = window.setInterval("Webc.toggleCursor()", 500);
        Webc.cursor(true);
    } else {
        window.clearInterval(Webc.interval);
        Webc.cursor(false);
    }
    Webc.cursorEnabled = enabled;
};

Webc.backup = function() {
    Webc.cursor(false);

    Webc.x = Webc.x_;
    Webc.y = Webc.y_;

    Webc.ctxScratch.save();
    Webc.ctxScratch.translate(Webc.x, Webc.y - 11);
    Webc.ctxScratch.fillStyle = "#ffffff";
    Webc.ctxScratch.fillRect( 0, 0, Webc.WIDTH - Webc.x, 12);
    Webc.ctxScratch.restore();    
    Webc.display();    

    Webc.print_str(Webc.inputStr);
};


Webc.addVarMap = function() {
    var funs,
        x,
        getList = function(map) {
            var vars,
                allvars,
                i;
            vars = Object.keys(map);
            allvars = [];
            for (i = 0; i < vars.length; i += 1) {
                name = vars[i];
                allvars.push(name);
            };
            allvars.sort(goog.string.caseInsensitiveCompare);
            return allvars;
        },
        getVarMap = function(fname) {
            var allvars = Webc.funMap[fname].allVariables,
                vmap = {},
                amap = {},
                vars,
                pair,
                name,
                i,
                ix,
                jx,
                varMap = {},
                varList,
                allList;    
            for (i = 0; i < allvars.length; i += 1) {
                pair = allvars[i];
                if (pair[0] === 0) {
                    name = pair[1];
                    vmap[name] = name;     
                } else {
                    name = pair[1];
                    amap[name] = name;
                } 
            }
            allvars = getList(vmap);
            // variable names
            varList = allvars;
            for (i = 0; i < allvars.length; i += 1) {
                name = allvars[i];
                ix = Math.floor(i / 3);
                jx = i % 3;
                varMap[name] = { ix: ix, jx: jx };
            }

            // arrays
            allvars = getList(amap);
            allList = [];
            // variable names + array names together
            allList = allList.concat(Webc.varList);
            allList = allList.concat(allvars);

            Webc.funMap[fname].varList = varList;
            Webc.funMap[fname].allList = allList;
            Webc.funMap[fname].varMap = varMap;
        };
    funs = getList(Webc.funMap);
    for (x = 0; x < funs.length; x += 1) {
        // alert('**addVarMap** ' + funs[x]);
        getVarMap(funs[x]);
    }
};

Webc.getPosition = function(event) {
    var i,
        obj,
        x,
        y;

    if (event.x !== undefined && event.y !== undefined) {
        x = event.x;
        y = event.y;
    } else { // Firefox method to get the position
        x = event.clientX + document.body.scrollLeft +
            document.documentElement.scrollLeft;
        y = event.clientY + document.body.scrollTop +
            document.documentElement.scrollTop;
    }
    x = x - Webc.ctxVariables.canvas.offsetLeft;
    y = y - Webc.ctxVariables.canvas.offsetTop;

    for (i = 0; i < Webc.uiBox.length; i += 1) {
        obj = Webc.uiBox[i];
        if (obj.intersects({ x: x, y: y })) {
            obj.update(Webc.ctxScratch2, true);
        }
    }
    //backCheckBox.draw();
};


Webc.varDraw = function(name, ctx) {
    var pos = Webc.varMap[name];
    //ctx.setFillColorRgb(0, 0, 0, 1);
    ctx.font = "14px sans-serif";
    ctx.fillText(name + ' : ', 40+80*pos.ix, 48+26*pos.jx);
    //if ()
    if (Webc.vm.frame.variables[name]!==undefined) {
        ctx.fillText(String(Webc.vm.frame.variables[name]), 70+80*pos.ix, 48+26*pos.jx);
    }
    Webc.display3();
};

Webc.onKeyDown = function(event) {
    var map = {12: 53, 33: 57, 34: 51, 35: 49, 36: 55, 37: 52, 38: 56, 39: 54, 40: 50, 45: 48},
        ch, 
        code = event.keyCode;
    if (!Webc.inputMode) {
        return;
    };
    // if it's backspace,
    if (code == 8) {
        // if input position is at least 1,
        if (Webc.inputStr.length > 0) {
            Webc.inputStr = Webc.inputStr.substr(0, 
                Webc.inputStr.length - 1);
            Webc.backup();
        }
    } else if (code === 13) {
        // done
        Webc.inputMode = false;
        Webc.nextLine();
        Webc.enableCursor(false);
        Webc.onInputDone(Webc.inputStr);
    } else if (code >= 48 && code < 58) {
        // insert the character at the string position, and increment input
        // position.
        ch = String.fromCharCode(code);
        Webc.inputStr += ch;
        Webc.inputPos += 1;
        Webc.putChar(ch);
    } else if (code >= 96 && code < 106) {
        // insert the character at the string position, and increment input
        // position.
        ch = String.fromCharCode(code-48);
        Webc.inputStr += ch;
        Webc.inputPos += 1;
        Webc.putChar(ch);    
    } else if (11 < code && code < 46) {
        code = map[code];
        if (code) {
            ch = String.fromCharCode(code);
            Webc.inputStr += ch;
            Webc.inputPos += 1;
            Webc.putChar(ch);
        }
    }
};

Webc.input = function(onInputDone) {
    Webc.enableCursor(true);
    Webc.onInputDone = onInputDone;
    Webc.inputMode = true;
    Webc.inputStr = '';
    Webc.inputPos = 0;
    Webc.x_ = Webc.x;
    Webc.y_ = Webc.y;
};

// array display 

Webc.putChar2 = function (str, x, y) {
    Webc.ctxArrays.save();
    Webc.ctxArrays.translate(x, y);
    Webc.ctxArrays.fillStyle = "#f8f8f8";
    Webc.ctxArrays.fillRect( 6, -11, 6, 12);    
    Webc.ctxArrays.strokeStyle = Webc.ctxScratch.strokeStyle;
    Webc.ctxArrays.fillStyle = Webc.ctxScratch.fillStyle;
    Webc.ctxArrays.fillText(str, 0, 0);
    Webc.ctxArrays.restore();
    Webc.display2();    
};

Webc.printArray2 = function (value, size1, size2, ix1, ix2) {
    var str = String(value),
        len = str.length,
        len1 = len > 3 ? 3 : len,
        i,
        x1 = 239 - 12 * size2 - 1 + 24 * ix2,
        y1 = 259 - 12 * size1 - 1 + 24 * ix1;
    for(i = 0; i < 4 - len; i += 1) {
        Webc.putChar2(' ', x1, y1);
        x1 += 6;
    }
    for(i = 0; i < len1; i += 1) {
        Webc.putChar2(String.fromCharCode(str.charCodeAt(i)), x1, y1);
        x1 += 6;
    }
    if(len > 3) {
        Webc.putChar2('?', x1, y1);
        x1 +=6;
    }
};

Webc.line = function(x1, y1, x2, y2) {
    Webc.ctxArrays.strokeStyle = Webc.ctxScratch.strokeStyle;
    Webc.ctxArrays.lineWidth = 1;
    Webc.ctxArrays.moveTo( x1+0.5, y1+0.5 );
    Webc.ctxArrays.lineTo( x2+0.5, y2+0.5 );
    Webc.ctxArrays.stroke();
};

Webc.lineTo = function(x, y) {
    Webc.line( Webc.x, Webc.y, x, y );
};

Webc.drawBox2 = function(size1, size2) {
    var x1 = 239 - 12 * size2 - 1,
        y1 = 239 - 12 * size1 - 1,
        x2 = 239 + 12 * size2 + 7,
        y2 = 239 + 12 * size1 + 7,
        i,
        j;

    // Clear the Arrays canvas
    //Webc.ctxArrays.save();
    Webc.ctxArrays.canvas.width = Webc.ctxScratch.canvas.width;

    Webc.ctxArrays.fillStyle = "#f8f8f8";
    Webc.ctxArrays.fillRect( 0, 0, Webc.WIDTH, Webc.HEIGHT);    

    Webc.line(x1, y1, x2, y1);
    Webc.line(x2, y1, x2, y2);
    Webc.line(x2, y2, x1, y2);
    Webc.line(x1, y2, x1, y1);
    Webc.putChar2(name, (x1 + x2)/2 - 12, y2 + 18);    
    //Webc.ctxArrays.restore();

    for (i = 0; i < size2; i += 1) {
        Webc.putChar2(String(i), x1 + 24 * i + (i>9 ? 12 : 18), y1 - 8);
    }
    for (i = 0; i < size1; i += 1) {
        Webc.putChar2(String(i), x1 - (i>9 ? 18 : 12) , y1 + 24 * i + 20);
    }
    for (i = 0; i < size2; i += 1) {
        for (j = 0; j < size1; j += 1) {
            Webc.putChar2('0',  x1 + 24 * i + 18, y1 + 24 * j + 20);
        }
    }    
};

Webc.drawBox1_ = function(name, size1, delta, first) {
    var nx,
        sz,
        x1,
        y1,
        x2,
        y2,
        i,
        j,
        array = Webc.vm.frame.variables[name];

    // Clear the Arrays canvas
    //Webc.ctxArrays.save();
    nx = (size1 > 100) ? 5 : Math.floor((size1 + 19) / 20);
    sz = (size1 > 20) ? 20 : size1;
    x1 = delta - 15 * nx - 10;
    y1 = 239 - 10 * sz - 8;
    x2 = delta + 15 * nx + 10;
    y2 = 239 + 10 * sz;

    if (first) {
        Webc.ctxArrays.canvas.width = Webc.ctxScratch.canvas.width;
        Webc.ctxArrays.fillStyle = "#f8f8f8";
        Webc.ctxArrays.fillRect( 0, 0, Webc.WIDTH, Webc.HEIGHT);    
    }

    Webc.line(x1, y1, x2, y1);
    Webc.line(x2, y1, x2, y2);
    Webc.line(x2, y2, x1, y2);
    Webc.line(x1, y2, x1, y1);
    Webc.putChar2(name, (x1 + x2)/2 - 8, y2 + 18);
    //Webc.ctxArrays.restore();

    if (size1 > 20) {
        sz = 20;
    } else {
        sz = size1;
    }
    for (i = 0; i < sz; i += 1) {
        Webc.putChar2(String(i), x1 - (i>9 ? 18 : 12) , y1 + 20 * i + 20);
    }
    //for (i = 0; i < size1; i += 1) {
    //    Webc.putChar2(String(i), x2 + (i>9 ? 6 : 12) , y1 + 20 * i + 20);
    //}
    for (i = 0; i < nx; i += 1) {
        if (size1 - 20 * i > 20) {
            sz = 20;
        } else {
            sz = size1 - 20 * i;
        }
        for (j = 0; j < sz; j += 1) {
            Webc.printArray1(name, j, array.b[j]);
        }
    }    
};

Webc.drawBox1 = function() {
    var name1,
        name2,
        size1,
        size2,
        array1,
        array2;
    if (Webc.oneList.length < 2) {
        name1 = Webc.oneList[0];
        array1 = Webc.vm.frame.variables[name1];
        size1 = array1.size;
        Webc.drawBox1_(name1, size1, 240, true);
    } else {
        name1 = Webc.oneList[0];
        name2 = Webc.oneList[1];
        array1 = Webc.vm.frame.variables[name1];
        array2 = Webc.vm.frame.variables[name2];
        size1 = Number(array1.size);
        size2 = Number(array2.size);
        Webc.drawBox1_(name1, size1, 150, true);
        Webc.drawBox1_(name2, size2, 355, false);
    }
};

Webc.printArray1 = function (name, index, value) {
    var array,
        size,
        nx,
        ix,
        sz,
        delta,
        str,
        len,
        len1,
        i,
        x1,
        y1;
    if (index > 99) {
        return;
    }    
    if (Webc.twoList.length > 0) {
        return;
    }
    if (Webc.oneList.indexOf(name) > 2) {
        return;
    }    
    array = Webc.vm.frame.variables[name];
    size = Number(array.size);
    nx = (size > 100) ? 5 : Math.floor((size + 19) / 20);
    ix = Webc.oneList.indexOf(name);
    sz = (size > 20) ? 20 : size;
    delta = (Webc.oneList.length < 2) ? 240 : ((ix === 0) ? 150 : 355);
    str = String(value);
    len = str.length;
    len1 = len > 3 ? 3 : len;
    x1 = delta - 15 * nx + 30 * Math.floor(index / 20);
    y1 = 239 - 10 * sz + 12 + 20 * (index % 20);

    for(i = 0; i < 4 - len; i += 1) {
        Webc.putChar2(' ', x1, y1);
        x1 += 6;
    }
    for(i = 0; i < len1; i += 1) {
        Webc.putChar2(String.fromCharCode(str.charCodeAt(i)), x1, y1);
        x1 += 6;
    }
    if(len > 3) {
        Webc.putChar2('?', x1, y1);
        x1 +=6;
    }
};

/**
 * Execute one step. 
 * Console output
 */
Webc.clearScreen = function () {
    Webc.x = 0;
    Webc.y = 11;
    Webc.ctxScratch.save();
    Webc.ctxScratch.translate(0, 0);
    Webc.ctxScratch.fillStyle = "#ffffff";
    Webc.ctxScratch.fillRect( 0, 0, Webc.WIDTH, Webc.HEIGHT);
    Webc.ctxScratch.restore();    
    Webc.display();    
};

Webc.nextLine = function () {
    Webc.x = 0;
    Webc.y += 12;    
    if (Webc.y > 480) {
        Webc.clearScreen();
    }
    Webc.display();    
};

Webc.putChar = function (str) {
    if (Webc.y > 480) {
        Webc.clearScreen();
    }
    Webc.ctxScratch.save();
    Webc.ctxScratch.translate(Webc.x, Webc.y);
    Webc.ctxScratch.fillText(str, 0, 0);
    Webc.ctxScratch.restore();
    Webc.x += 6;
    if (Webc.x > 474) {
        Webc.x = 0;
        Webc.y += 12;
    }
    Webc.display();    
};

Webc.print_str = function (text) {
    var i,
        x;
    for(i = 0; i < text.length; i += 1) {
        x = String.fromCharCode(text.charCodeAt(i));
        Webc.putChar(x);
    }
};

Webc.print_str_x = function (text, times) {
    var i,
        j,
        x;
    for(i = 0; i < times; i+= 1) {
        for(j = 0; j < text.length; j += 1) {
            x = String.fromCharCode(text.charCodeAt(j));
            Webc.putChar(x);
        }
    }
};

Webc.print4 = function (format, value) {
    var str = String(value),
        len = str.length,
        i;
    for(i = 0; i < format - len; i += 1) {
        Webc.putChar(' ');
    }
    for(i = 0; i < len; i += 1) {
        Webc.putChar(String.fromCharCode(str.charCodeAt(i)));
    }
};

Webc.print_num = function (value) {
    var str = String(value),
        len = str.length,
        i;
    for(i = 0; i < len; i += 1) {
        Webc.putChar(String.fromCharCode(str.charCodeAt(i)));
    }
};

/**
 * Save an image of the SVG canvas.
 */
Webc.createImageLink = function () {
    var imgLink = document.getElementById('downloadImageLink');
    imgLink.setAttribute('href',
        document.getElementById('display').toDataURL('image/png'));
    var temp = window.onbeforeunload;
    window.onbeforeunload = null;
    imgLink.click();
    window.onbeforeunload = temp;
};


// code generation from workspace
Webc.workspaceToCode = function(topblock) {
    var blocks,
        x,
        block,
        code,
        name,
        types = ['procedures_defnoreturn', 'procedures_defreturn'],
        funToCode = function(fname, block) {  
            while (block) {
                Webc.blockToCode(block);
                block = block.getNextBlock();
            }
            // alert('$$$ ' + JSON.stringify(Webc.instructions));
            // alert(JSON.stringify(Webc.instructions));
            Webc.funMap[fname] = { 
                instructions: Webc.instructions,
                allVariables: Webc.allVariables,
                varList: null,
                allList: null,
                varMap: null
            };
        };

    blocks = Blockly.mainWorkspace.getTopBlocks(true);
    for (x = 0; block = blocks[x]; x += 1) {
        // alert('block.type = ' + block.type);
        if (block === topblock) {
            name = '_main_';
            Webc.instructions = [];
            Webc.allVariables = [];
            funToCode(name, block);
            // finishUp() instruction
            Webc.instructions.push({ kind: 41 });
        } else if (types.indexOf(block.type) >= 0) {
            name = block.getFieldValue('NAME');
            // alert('****** ' + name);
            Webc.instructions = [];
            Webc.allVariables = [];
            funToCode(name, block);
            //code = JSON.stringify(Webc.instructions);
            //code = code.replace(/,"id":"\d+"/g, '');
            //generalAlert(code);
        }
    }
};

Webc.valueToCode = function(block, name) {
    var targetBlock = block.getInputTargetBlock(name);
    // alert('.. valueToCode .. targetBlock = ' + targetBlock);
    if (targetBlock === undefined) {
        generalAlert('[null]');
        return null;
    }
    //alert(block + ' ::: ' + targetBlock);
    return Webc.blockToCodeOne(targetBlock);
};

Webc.statementToCode = function(block, name) {
    var targetBlock = block.getInputTargetBlock(name),
        code;
    while (targetBlock) {
        this.blockToCode(targetBlock);
        targetBlock = targetBlock.getNextBlock();
    } 
};

Webc.blockToCodeOne = function(block) {
    var func;
    if (!block) {
        return undefined;
    }
    if (block.disabled) {
        // Skip past this block if it is disabled.
        return this.blockToCode(block.getNextBlock());
    }

    func = this[block.type];
    if (func === undefined) {
        generalAlert('### block type = ' + block.type);
    }
    // First argument to func.call is the value of 'this' in the generator.
    return func.call(block, block);
};

Webc.blockToCode = function(block) {
    var func;
    if (!block) {
        return;
    }
    if (block.disabled) {
        // Skip past this block if it is disabled.
        this.blockToCode(block.getNextBlock());
    }

    func = this[block.type];
    if (!func) {
        generalAlert('### block type = ' + block.type);
    }
    // First argument to func.call is the value of 'this' in the generator.
    // Prior to 24 September 2013 'this' was the only way to access the block.
    // The current prefered method of accessing the block is through the second
    // argument to func.call, which becomes the first parameter to the generator.
    func.call(block, block);
};

Webc.p1set = [
    '',
    'ABaCjDeCjDdEImJK',
    'ABaCjDeCjDdEIpJK',
    'ABaCjDgEFaCmDdGIqLK',
    'ABaFaCjDfECmDdGIqMK',
    'ABbCjDgEFaCnDdGIqLK',
    'ABbFaCjDgECnDdGIqMK',
    'ABbCjDgEFmCjDdGIqLK',
    'ABcCjDgHFmCjDdGIqLK', 
    'ABbCjDiEFmCnDdGIqNFaCmDdGIqOK',
    'ABaFaCjDhECnDoPQCmDdGIqRK'
];    
Webc.p1Expand = function(index) {
    var code,
        x,
        result='';
    code = Webc.p1set[index];
    for (x = 0; x < code.length; x += 1) {
        result += Webc.p1sourceMap[code[x]];
    }
    code = '';
    for (x = 0; x < result.length; x += 1) {
        if (['#','$','!','%','&','_',';'].indexOf(result[x]) > -1) {
            code += Webc.p1sourceMap[result[x]];
        } else {
            code += result[x];
        }
    }
    return code;
} 

Webc.p2set = [
    '',
    'ABaCjDdSjTK',
    'ABaCjDsESmUK',
    'ABaCjDuEVnSmWK',
    'ABaCjDuEVnSpWK',
    'ABaCjDuEVnSpXCvDuYVnSpWK',
    'ABaCjDeEVnSpVwSpZCvDeYVnSpVwSpZ^K',
    'ABaCjDgEVnSpVwS7VwSpyK',
    'ABaCjDuEVzSpXBaCjDgEVnSpVwS7VwSpyK',
    'ABa2^CjDu3Sj3X2^^K',
    'ABa4^CkDrE4546CjDrY45464^^K'
];
    
Webc.p2Expand = function(index) {
    var code,
        x,
        result='';
    code = Webc.p2set[index];
    for (x = 0; x < code.length; x += 1) {
        result += Webc.p1sourceMap[code[x]];
    }
    code = '';
    for (x = 0; x < result.length; x += 1) {
        if (['#','$','!','%','&','_',';'].indexOf(result[x]) > -1) {
            code += Webc.p1sourceMap[result[x]];
        } else {
            code += result[x];
        }
    }
    return code;
} 

Webc.p1sourceMap = {
    "A":  '[{"kind":39,"args":["n"]},',
    "B":  '{"kind":11,"name":"x","value":{"kind":7,"name":"',
    "C":  '{"kind":23,"value":{"kind":7,"name":"',
    "D":  '{"kind":24,"arg1":0,"arg2":0,"value":',
    "E":  '{"kind":12!1"}},',
    "F":  '{"kind":11%',
    "G":  '{"kind":12%1"}},',
    "H":  '{"kind":12!-n"}},',
    "I":  '{"kind":21,"arg1":{"kind":1,"value":"4"},"value":{"kind":7,"name":"',
    "J":  '#7$',
    "K":  '{"kind":40,"value":null}]',
    "L":  '#9$',
    "M":  '#8$',
    "N":  '{"kind":25,"value":3},',
    "O":  '#15$',
    "P":  '{"kind":19,"name":"____"},',
    "Q":  '{"kind":25,"value":2},',
    "R":  '#12$',
    "S":  '{"kind":20,"name":"*","value":{"kind":7,"name":"',
    "T":  '&{"kind":25,"value":3},&',
    "U":  '&{"kind":25,"value":4},&',
    "V":  '{"kind":20,"name":"_","value":{"kind":7,"name":"',
    "W":  '&{"kind":25,"value":5},&',
    "X":  '&{"kind":25,"value":5},',
    "Y":  '{"kind":12!-1"}},',
    "Z":  '&{"kind":25,"value":7},',
    "_":  ' ',
    "#":  '{"kind":25,"value":3},{"kind":18},{"kind":25,"value":',
    "$":  '},{"kind":18},',
    "!":  ',"name":"x","value":{"kind":7,"name":"',
    "%":  ',"name":"y","value":{"kind":7,"name":"',
    "&":  '{"kind":18},',
    "^":  '&',
    ";":  '$',
    "a":  '0"}},',
    "b":  '-1"}},',
    "c":  'n*n"}},',
    "d":  '3},',
    "e":  '7},',
    "f":  '8},',
    "g":  '9},',
    "h":  '12},',
    "i":  '15},',
    "j":  'n"}},',
    "k":  'n+1"}},',
    "m":  'x"}},',
    "n":  'n-x"}},',
    "o":  '2},',
    "p":  '2*x-1"}},',
    "q":  'y"}},',
    "r":  '6},',
    "s":  '4},',
    "u":  '5},',
    "v":  'n-1"}},',
    "w":  '2*(n-x)"}},',
    "y":  '&{"kind":25,"value":9},&',
    "z":  '4*n-x-1"}},',
    "2":  '{"kind":20,"name":";","value":{"kind":7,"name":"n+2"}},',
    "3":  '{"kind":19,"name":";"},',
    "4":  '{"kind":19,"name":"*"},',
    "5":  '{"kind":20,"name":"@","value":{"kind":7,"name":"x-1"}},',
    "6":  '&{"kind":25,"value":6},',
    "7":  '2*n+2*x-1"}},'
};

Webc.p34set = [
    '',
    'AFmz',
    'AFnz',
    'AFoz',
    'AFpz',
    'Aqz',
    'AFrz',
    'AFsz',
    'Btz',
    'AFuz',
    'Bvz',
    'Awz',
    'Axz',
    'Ayz',
    'aei',
    'bfj',
    'cgk',
    'dhl'
];
    
Webc.p34Expand = function(index) {
    var code,
        temp,
        x,
        keys=['C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S'],
        result='';
    code = Webc.p34set[index];
    for (x = 0; x < code.length; x += 1) {
        result += Webc.p34sourceMap[code[x]];
    }
    temp = '';
    for (x = 0; x < result.length; x += 1) {
        if (keys.indexOf(result[x]) > -1) {
            temp += Webc.p34sourceMap[result[x]];
        } else {
            temp += result[x];
        }
    }    
    code = '';
    for (x = 0; x < temp.length; x += 1) {
        if (['`','~','@','#','$','^','_',';'].indexOf(temp[x]) > -1) {
            code += Webc.p34sourceMap[temp[x]];
        } else {
            code += temp[x];
        }
    }
    return code;
} 
Webc.p34sourceMap = {
    "a":  'E`15R1@200;1"]},`15~bl"#`1@200}},`22@`1@"1M`28~k"},'
          + '`29~k"#I"}@24},`11~iQ0M`11~jQ0M`11~cQ0M`'
          + '26#`3~>"#`5~O}$`1@"0"}}@12},',
    "b":  'E`15R1@30;1"]},`15~bl"#`1@30}},Cn"}@16},Dn-1-i"}@2}'
          + ',`19~__"},G',
    "c":  'E`15~Pn+1MCn+1"}@2},`13~O@`4~iM`30~i"@2},`'
          + '13R1@"1"}@`1@"0MCn/2+1"}@8},',
    "d":  'E`15R4~n";2","3"]},`11~iQ2M`11~xQ3M`26#`3~'
          + '<"#`4~i"}$`4~n"}}@12},`12~xQ2M`13~O@`4~L`'
          + '11~jH11~y"@`5R4~jJ,',
    "e":  '`33#`3~=="#`5~O}$`5~Pi+1J@2},`12~cH34@6},`'
          + '12~cQ1M`13~bl"#`4~j"}@`5R4~iJ,`12~jH13~bl"#`4'
          + '~j"}@`4~cM`12~jH11~cQ0M',
    "f":  '`13~bl"#`1@"0"}@`1@"1MDi+1"}@3},`13~bl"#`7~j+1"}@`3~+"#`5'
          + 'R4~j"}}$`5~Pj+1J},`21#`1@"4"}@`5R4~jJ,`'
          + '30~j"@3},`18},Di+2"}@2},',
    "g":  '`31#`3~>"#`5~O}$`1@"0"}}@5},`11~j"@`7~i*iM`26#`3'
          + '~<"#`4~j"}$`7~n+1"}}@3},`13R4~j"}@`1@"0M`12~j"@`4~'
          + 'iM`27@3},',    
    "h":  '`26#`3~&&"#`3~<"#`7~y*y"}$`4~x"}}$`3~>"#`7~x%y"}$`1@"0J@3'
          + '},`12~jH11~y"@`5R4~jJ,`27@3},`31#`3~>"#`7~y*y"}$`4'
          + '~x"}}@1},`12~iH32},`27@12},Cn"}@2},`21#`1@"5"}@`5R'
          + '4~iJ,',   
    "i":  '`35},`12~iH27@12},`18},`11~iQ0M`26#`3~>"#`5~bl"#`4~i'
          + '"}}$`1@"0"}}@4},`22@`5~bl"#`4~iJ,`13~O@`5~bl"#'
          + '`4~iJ,`12~iH27@4},`30~k"@24},`18},`40@^}]',    
    "j":  '`13R4~j"}@`5~bl"#`4~jJ,G`30~i"@16},`40@^}]',
    "k":  '`32},`30~i"@8},Cn+1"}@4},`31#`3~>"#`5~O}$`1@"0"}'
          + '}@1},`21#`1@"4"}@`4~iM`32},`30~i"@4},`18},`40@^}]',
    "l":  '`30~i"@2},`18},`40@^}]',
    "m":  'Cn"}@6},Dn"}@3},`12~xQ1MK`7~jSLN`30~i"@6},',
    "n":  'Cn"}@6},Dn"}@3},`12~xH14~Pj"}$`7~iSLN`30~i"@6},',
    "o":  'Cn"}@6},Dn"}@3},`12~xQ1M`14~al"#I-i"}$`7~jSL`30'
          + '~j"@3},`30~i"@6},',
    "p":  'Cn"}@14},`33#`7~i%2==0"}@6},Dn"}@3},`12~xH14~Pi"}$`'
          + '7~jSLN`34@5},Dn"}@3},`12~xQ1MKI-j"}@'
          + '`7~LN`35},`30~i"@14},',      
    "q":  'Cn"}@7},`14~P0"}$`7~iS9MKIS9M`14~al"#I"}$'
          + '`7~iS9MK`7~0S9MK`7~iS9MKI-iS9M`30~i"@7},',
    "r":  'Dn-1"}@3},`12~xH14~P0"}$`7~jSLNDn-1"}'
          + '@3},`12~xH14~Pj"}$ISLNDn-1"}@3},`12'
          + '~xQ1M`14~al"#I"}$I-jSLNDn-1"}@3},`12'
          + '~xH14~al"#I-j"}$`7~0SLN',
    "s":  'Cn/2"}@21},Dn-1-2*i"}@3},`12~xH14~Pi"}$`7~i+jS'
          + 'LNDn-1-2*i"}@3},`12~xH14~Pi+j"}$I-i"}@`7'
          + '~LNDn-1-2*i"}@3},`12~xH14~al"#I-i"}$I-i-j"}@`7'
          + '~LNDn-1-2*i"}@3},`12~xQ1M`14~al"#I-i-j"}$'
          + '`7~iSLN`30~i"@21},`31#`7~n%2==1"}@3},`12~'
          + 'xH14~Pn/2"}$`7~n/2SL`32},',
    "t":  'Cn/2"}@17},Dn-1-2*i"}@2},K`7~i+jSn/2+1-iMGDn-1-2*i"}'
          + '@2},`14~Pi+j"}$I-iSn/2+1-iMGDn-1-2*i"}@2},`1'
          + '4~al"#I-i"}$I-i-jSn/2+1-iMGDn-1-2*i"}@2},`14~al"#I'
          + '-i-j"}$`7~iSn/2+1-iMG`30~i"@17},`14~Pn/2"}$`'
          + '7~n/2S1M',
    "u":  'Cn"}@6},Di+1"}@3},`12~xQ1M`14~Pi-j"}$`7~j"}@`7'
          + '~LN`30~i"@6},Cn-1"}@6},Dn-1-i"}@3},`12~xH14~al'
          + '"#I-j"}$`7~1+i+jSLN`30~i"@6},',
    "v":  'F`11~y"@`7~n/2MCn*n"}@8},`14~Px"}$`7~ySi+1M`33'
          + '#`7~(i+1)%n==0"}@2},`12~xH34@2},`11~x"@`7~(x+n-1)%nM`11'
          + '~y"@`7~(y+1)%nM`35},`30~i"@8},',
    "w":  'Cn"}@5},Dn"}@2},`14~O$`4~jS(i+j+1)%2MG`30~i"@5},',
    "x":  'Cn"}@5},Dn"}@2},`14~O$`4~jS(i/2+j/2+1)%2MG`30~i"@5},',
    "y":  'Cn"}@5},Dn"}@2},`14~O$`4~jS(i/3+j/3+1)%2MG`30~i"@5},',
    "z":  'Cn"}@6},Dn"}@2},`21#`1@"4"}@`6~O$`4~jJ,G`18},`30'
          + '~i"@6},`18},`40@^}]',
    "A":  'E`16R4~n"}$`4~nM',
    "B":  'E`31#`7~n%2==0"}@2},`12~nH32},`16R4~n"}$`4~nM',
    "C":  '`28~i"},`29~i"#`7~',
    "D":  '`28~j"},`29~j"#`7~',
    "E":  '[`39,"args":["n"]},',
    "F":  '`11~x"@`1@"0"}},',
    "G":  '`30~j"@2},',
    "H":  '"@`1@"1"}},`',
    "I":  '`7~n-1',
    "J":  '"}}}',
    "K":  '`14~al"#`7~i"}$',
    "L":  'x"}},',
    "M":  '"}},',
    "N":  '`30~j"@3},',
    "O":  'al"#`4~i"}',
    "P":  'al"#`7~',
    "Q":  '"@`1@"',
    "R":  '~al"#`',
    "S":  '"}@`7~',
    "_":  ' ',
    "`":  '{"kind":',
    "~":  ',"name":"',
    "@":  ',"value":',
    "#":  ',"arg1":',
    "$":  ',"arg2":',
    "^":  'null',
    ";":  '},"options":["'
};

Webc.expandProblems = function() {    
    var x,
        fname,
        instructions;
    for (x = 1; x < 11; x += 1) {
        instructions = JSON.parse(Webc.p1Expand(x));
        // alert(JSON.stringify(instructions));
        Webc.funMap2['_p1_' + x] = { 
            instructions: instructions,
            allVariables: [],
            varList: null,
            allList: null,
            oneList: [],
            twoList: [],            
            varMap: null
        }
    }
    
    for (x = 1; x < 11; x += 1) {
        instructions = JSON.parse(Webc.p2Expand(x));
        // alert(JSON.stringify(instructions));
        Webc.funMap2['_p2_' + x] = { 
            instructions: instructions,
            allVariables: [],
            varList: null,
            allList: null,
            oneList: [],
            twoList: [],
            varMap: null
        }
    }

    for (x = 1; x < 14; x += 1) {
        instructions = JSON.parse(Webc.p34Expand(x));
        // alert(JSON.stringify(instructions));
        Webc.funMap2['_p3_' + x] = { 
            instructions: instructions,
            allVariables: [],
            varList: null,
            allList: null,
            oneList: [],
            twoList: [],            
            varMap: null
        }
    }    

    for (x = 1; x < 5; x += 1) {
        var maps = [null,
                {"n":{ix:0,jx:0},"i":{ix:0,jx:1},"j":{ix:0,jx:2}},
                {"n":{ix:0,jx:0},"i":{ix:0,jx:1},"j":{ix:0,jx:2}},
                {"n":{ix:0,jx:0},"i":{ix:0,jx:1},"j":{ix:0,jx:2}},
                {"n":{ix:0,jx:0},"x":{ix:0,jx:1},"y":{ix:0,jx:2},
                    "i":{ix:1,jx:0},"j":{ix:1,jx:1}}
            ]
        instructions = JSON.parse(Webc.p34Expand(x+13));
        // alert(JSON.stringify(instructions));
        Webc.funMap2['_p4_' + x] = { 
            instructions: instructions,
            allVariables: [],
            varList: null,
            allList: null,
            oneList: ((x < 3) ? ['al', 'bl'] : ['al']),
            twoList: [],            
            varMap: maps[x]
        }
    } 
};
/**
 * Add one or more words to the list of reserved words for this language.
 * @param {string} words Comma-separated list of words to add to the list.
 *     No spaces.  Duplicates are ok.
 */
Webc.addReservedWords = function(words) {
    Webc.RESERVED_WORDS_ += words + ',';
};


/**
 * Display a storage-related modal dialog.
 * @param {string} message Text to alert.
 */
function generalAlert(message) {
  var container = document.getElementById('containerStorage');
  container.textContent = '';
  var lines = message.split('\n');

  Webc.done = true;
  // alert('yo');

  for (var i = 0; i < lines.length; i++) {
    var p = document.createElement('p');
    p.appendChild(document.createTextNode(lines[i]));
    container.appendChild(p);
  }

  var content = document.getElementById('dialogStorage');
  var origin = document.getElementById('linkButton');
  var style = {
    width: '50%',
    left: '25%',
    top: '5em'
  };
  BlocklyApps.showDialog(content, origin, true, true, style,
      BlocklyApps.stopDialogKeyDown());
  BlocklyApps.startDialogKeyDown();
};


//     JavaScript Expression Parser (JSEP) 0.2.9
//     JSEP may be freely distributed under the MIT License
//     http://jsep.from.so/
//     Parsing
//     -------
//     `expr` is a string with the passed in expression
function parseExpr(expr) {
  // `index` stores the character number we are currently at while `length` is a constant
  // All of the gobbles below will modify `index` as we move along
  var index = 0,
    length = expr.length,
    binary_ops = {
      '||': 1, '&&': 2, '==': 3, '!=': 3, 
      '<': 4,  '>': 4,  '<=': 4,  '>=': 4, 
      '+': 5, '-': 5,
      '*': 6, '/': 6, '%': 6
    },

    throwError = function(message, index) {
        alert(message);
        // generalAlert(message + ' : ' + index);
    },

    // Returns the precedence of a binary operator or `0` if it isn't a binary operator
    binaryPrecedence = function(op_val) {
      var binary_ops = {
        '||': 1, '&&': 2, '==': 3, '!=': 3, 
        '<': 4,  '>': 4,  '<=': 4,  '>=': 4, 
        '+': 5, '-': 5,
        '*': 6, '/': 6, '%': 6
      };

      return binary_ops[op_val] || 0;
    },

    // Utility function (gets called from multiple places)
    // Also note that `a && b` and `a || b` are *logical* expressions, not binary expressions
    createBinaryExpression = function (operator, left, right) {
      return {
        kind: 3,
        name: operator,
        arg1: left,
        arg2: right
      };
    },   

    // `ch` is a character code in the next three functions
    isDecimalDigit = function(ch) {
      return (ch >= 48 && ch <= 57); // 0...9
    },

    isIdentifierStart = function(ch) {
      return (ch >= 65 && ch <= 90) || // A...Z
          (ch >= 97 && ch <= 122); // a...z
    },

    isIdentifierPart = function(ch) {
      return (ch === 95) ||         // `_`
          (ch >= 65 && ch <= 90) || // A...Z
          (ch >= 97 && ch <= 122) || // a...z
          (ch >= 48 && ch <= 57); // 0...9
    },

     // Push `index` up to the next non-space character
    gobbleSpaces = function() {
      var ch = expr.charCodeAt(index);
      // space or tab
      while(ch === 32 || ch === 9) {
        ch = expr.charCodeAt(++index);
      }
    },

    // The main parsing function. 
    gobbleExpression = function() {
      var test = gobbleBinaryExpression();
            
      gobbleSpaces();
      return test;
    },
     // Search for the operation portion of the string (e.g. `+`, `===`)
    // Start by taking the longest possible binary operations (3 characters: `===`, `!==`, `>>>`)
    // and move down from 3 to 2 to 1 character until a matching binary operation is found
    // then, return that binary operation
    gobbleBinaryOp = function() {
      gobbleSpaces();
      var biop, 
        to_check = expr.substr(index, 2), 
        tc_len = to_check.length;
      while(tc_len > 0) {
        if(binary_ops.hasOwnProperty(to_check)) {
          index += tc_len;
          return to_check;
        }
        to_check = to_check.substr(0, --tc_len);
      }
      return false;
    },
     // This function is responsible for gobbling an individual expression,
    // e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
    gobbleBinaryExpression = function() {
      var ch_i, node, biop, prec, stack, biop_info, left, right, i;
       // First, try to get the leftmost thing
      // Then, check to see if there's a binary operator operating on that leftmost thing
      left = gobbleToken();
      biop = gobbleBinaryOp();
       // If there wasn't a binary operator, just return the leftmost node
      if(!biop) {
        return left;
      }
      // Otherwise, we need to start a stack to properly place the binary operations in their
      // precedence structure
      biop_info = { value: biop, prec: binaryPrecedence(biop)};

      right = gobbleToken();
      if (!right) {
        throwError("Expected expression after " + biop, index);
      }
      stack = [left, biop_info, right];
       // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
      while((biop = gobbleBinaryOp())) {
        prec = binaryPrecedence(biop);
        if(prec === 0) {
          break;
        }
        biop_info = { value: biop, prec: prec };

        // Reduce: make a binary expression from the three topmost entries.
        while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
          right = stack.pop();
          biop = stack.pop().value;
          left = stack.pop();
          node = createBinaryExpression(biop, left, right);
          stack.push(node);
        }

        node = gobbleToken();
        if(!node) {
          throwError("Expected expression after " + biop, index);
        }
        stack.push(biop_info, node);
      }
      i = stack.length - 1;
      node = stack[i];
      while(i > 1) {
        node = createBinaryExpression(stack[i - 1].value, stack[i - 2], node); 
        i -= 2;
      }
      return node;
    },

    // An individual part of a binary expression:
    // e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
    gobbleToken = function() {
      var ch, 
        curr_node, 
        unop, 
        to_check, 
        tc_len,
        unary_ops = {'-': true, '!': true};
                    
      gobbleSpaces();
      // alert('index = ' + index + ' length = ' + length);
      if (index >= length) {
        return undefined;
      }
      ch = expr.charCodeAt(index);

      if(isDecimalDigit(ch)) {
        // Char code 46 is a dot `.` which can start off a numeric literal
        return gobbleNumericLiteral();
      } else if(isIdentifierStart(ch) || ch === 40) { // open parenthesis
        // `foo`, `bar.baz`
        return gobbleVariable();
      } else {
        to_check = expr.substr(index, 1);
        tc_len = to_check.length;
        while(tc_len > 0) {
          if(unary_ops.hasOwnProperty(to_check)) {
            index += tc_len;
            return {
              kind: 2,
              name: to_check,
              arg1: gobbleToken()
            };
          }
          to_check = to_check.substr(0, --tc_len);
        }
        throwError('Unexpected ' + expr.charAt(index), index);
        return false;
      }
    },
    // Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
    // keep track of everything in the numeric literal and then calling `parseFloat` on that string
    gobbleNumericLiteral = function() {
      var number = '', ch;
      while(isDecimalDigit(expr.charCodeAt(index))) {
        number += expr.charAt(index++);
      }
                    
      ch = expr.charAt(index);

      // Check to make sure this isn't a variable name that start with a number (123abc)
      if(isIdentifierStart(expr.charCodeAt(index))) {
        throwError( 'Variable names cannot start with a number (' +
              number + expr.charAt(index) + ')', index);
      }

      return {
        kind: 1,
        value: Number(parseFloat(number))
      };
    },
                
    // Gobbles only identifiers
    // e.g.: `foo`, `_value`, `$x1`
    // Also, this function checks if that identifier is a literal:
    // (e.g. `true`, `false`, `null`) or `this`
    gobbleIdentifier = function() {
      var ch = expr.charCodeAt(index),
          node1 = null,
          node2 = null, 
          start = index, 
          identifier;

      if(isIdentifierStart(ch)) {
        index += 1;
      } else {
        throwError('Unexpected ' + expr.charAt(index), index);
      }

      while(index < length) {
        ch = expr.charCodeAt(index);
        if(isIdentifierPart(ch)) {
          index += 1;
        } else {
          break;
        }
      }
      identifier = expr.slice(start, index);
      if (index + 2 < expr.length) {
        ch = expr.charCodeAt(index);
        if (ch === 91) {
          node1 = gobbleArrayIndex();
          if (index + 2 < expr.length) {
            ch = expr.charCodeAt(index);
            if (ch === 91) {
              node2 = gobbleArrayIndex();
            }
          }
        }
      } 
      if (!node1) {
        return {
          kind: 4,
          name: identifier
        }
      } else if (!node2) {
        return {
          kind: 5,
          name: identifier,
          arg1: node1
        }
      } else {
        return {
          kind: 6,
          name: identifier,
          arg1: node1,
          arg2: node2
        }

      }
    },

    // Gobble a non-literal variable name. This variable name may include properties
    // e.g. `foo`, `bar.baz`, `foo['bar'].baz`
    gobbleVariable = function() {
      var ch_i, node;
      ch_i = expr.charCodeAt(index);
            
      if(ch_i === 40) { // open parenthesis
        node = gobbleGroup();
      } else {
        node = gobbleIdentifier();
      }
      return node;
    },

    // Responsible for parsing a group of things within parentheses `()`
    gobbleGroup = function() {
      var node;
      index++;
      node = gobbleExpression();
      gobbleSpaces();
      if(expr.charCodeAt(index) === 41) {  // close parenthesis
        index++;
        return node;
      } else {
        throwError('Unclosed (', index);
      }
    },

    // Responsible for parsing a group of things within parentheses `()`
    gobbleArrayIndex = function() {
      var node;
      index++;
      node = gobbleExpression();
      gobbleSpaces();
      if(expr.charCodeAt(index) === 93) {  // close parenthesis
        index++;
        return node;
      } else {
        throwError('Unclosed ]', index);
      }
      alert(JSON.stringify(node));
    },

    ch_i, node;
                
    ch_i = expr.charCodeAt(index);
    // Try to gobble each expression individually
    node = gobbleExpression();
    return node;
};


/**
    The following code have been heavily modified from qb.js by Steve Hanov

// virtual machine

** @constructor */
function StackFrame(fname, pc) {
    // Address to return to when the subroutine has ended.
    this.pc = pc;
    // each function has its own function name
    this.fname = fname;
    // map from name to the Scalar or Array variable.
    this.variables = {};
}

/**
 Defines the instruction set of the virtual machine, 
 and consists of a record of the following values:

 kind: kind of instruction
       one kind does   [[ value return ]]
           - returns the value 
           - include input retunned value, 
           - (later functions returning the value)
       the other kind does  [[ execution ]]
           - the control and 
           - set the variables, or arrays,
           - or output to the console
           - keyboard input manipulation
           - (later functions not returning the value)

 name: The string value of the instruction 
           usually tells the operation name, 
           variable name, or array name.

 arg1: argument1 of the instruction
           itself can be instruction (returning value)
           or just the value // repeat 

 arg2: argument2 of the instruction
           itself can be instruction (returning value)
           or just the value // repeat

 value: value of the instruction (returning value)
           itself can be instruction
           or just the value // constant or program counter

 options: extra options of the instruction

 id: block id 

 */
/** @constructor */
function VirtualMachine() {
    // program counter.
    this.pc = 0;

    // list of StackFrames. The last one is searched for variable references.
    // Failing that, the first one ( the main procedure ) is searched for any
    // shared variables matching the name.
    this.callstack = [];

    // The bytecode (array of Instruction objects)
    this.instructions = [];

    // for input handling
    this.suspended = false;
    this.returnValue = null;

    // parameter passing
    this.args = null;
}

VirtualMachine.prototype = {
    /**
     Resets the virtual machine, halting any running program.
     */
    reset_: function (fname) {
        this.callstack = [];
        this.callstack.push(new StackFrame(fname, 0));
        this.frame = this.callstack[0];
        this.suspended = false;
        Webc.enableRunButton();
    },

    reset: function (program) {
        if (program) {
            this.instructions = program;
        }
        this.pc = 0;
    },

    /**
     Run a program 
     */
    run: function (program) {
        this.reset(program);
        while (!this.suspended && (this.pc < this.instructions.length)) {
            this.runOneInstruction();
        } 
        if (this.pc === this.instructions.length) { 
            Webc.enableRunButton();
        }
    },

    runOneInstruction: function () {
        var instr = this.instructions[this.pc];
        this.pc += 1;
        // Blockly.mainWorkspace.highlightBlock(instr.id);

        this.execute(instr);

        if (Webc.done) {
            return null;
        }
        return instr.id;
    },

    /**
     Run a program 
     */
    runAfter: function () {
        while (!this.suspended && (this.pc < this.instructions.length)) {
            this.runOneInstruction();
        } 
        if (this.pc === this.instructions.length) { 
            Webc.enableRunButton();
        }
    },

    /**
     Suspend the CPU, maintaining all state. This happens when the program
     is waiting for user input.
     */
    suspend: function() {
        this.suspended = true;
    },

    /**
     Resume the CPU, after previously being suspended.
     */
    resume: function() {
        this.suspended = false;
        Webc.nextStep();
        // this.runAfter();
    },

    finishRun: function() {
        Webc.done = true;
    },

    waitForClick: function() {
        this.suspend();
    }, 

    glueFuncArgs: function(instr) {
        // return address
        var x,
            array,
            val;
        // alert('glueFuncArgs');    
        for (x = 0; x < this.args.length; x += 1) {
            val = this.args[x];
            if (!val.kind) {
                val = { kind: 1, value: val }
                this.setVariable(instr.args[x], val);
            } else if (val.kind === 5) {  
                // first indirect array access
                array = { kind: 0, name: val.name, frameId: val.arg2 };
                this.frame.variables[instr.args[x]] = array;
            } else if (val.kind === 0) {
                // second indirect array access
                this.frame.variables[instr.args[x]] = val;
            } else {
                this.setVariable(instr.args[x], val);
            }
        }
    },

    callFunc: function(instr) {
        var fname = instr.name,
            x,
            val,
            deepCopy = function(o) {
                var copy = o,
                    k;
 
                if (o && typeof o === 'object') {
                    copy = Object.prototype.toString.call(o) === '[object Array]' ? [] : {};
                    for (k in o) {
                        copy[k] = deepCopy(o[k]);
                    }
                }
 
                return copy;
            };

        // alert('*** callFunc instr = ' + JSON.stringify(instr));        
        // return address
        this.frame.pc = this.pc;
        // glue args
        //ert(JSON.stringify(instr));
        this.args = deepCopy(instr.args);
        //alert(JSON.stringify(this.args));
        for (x = 0; x < this.args.length; x += 1) {
            // if array1 parameter is used, arg2 tells the frame id where this array1 comes
            if (this.args[x].kind === 5) {
                // if array1 parameter is already indrect array access case
                if (this.frame.variables[this.args[x].name].name) {
                    this.args[x] = this.frame.variables[this.args[x]];
                // array1 parameter is used first here.
                } else {
                    this.args[x].arg2 = this.callstack.length - 1;
                }
            } else {
                val = this.checkValue('in function ' + fname + ' binding parameters ', 
                        this.args[x]);
                this.args[x] = val;
            }
        };

        // store Webc.oneList and Webc.twoList to funMap
        // these lists are created at runtime.
        // Webc.oneList: array1 list as created by initArray1 at runtime
        // Webc.twoList: array2 list as created by initArray2 at runtime
        Webc.funMap[this.frame.fname].oneList = Webc.oneList;
        Webc.funMap[this.frame.fname].twoList = Webc.twoList;

        // alert('***   ***$$$ ' + JSON.stringify(this.args));        
        // get new StackFrame
        this.callstack.push(new StackFrame(instr.name, 0));
        // switch frame
        this.frame = this.callstack[this.callstack.length - 1];
        this.frame.fname = fname;
        // alert('$$$ ' + JSON.stringify(this.args));        
        // switch instructions
        if (/_p._/.test(fname)) {
            Webc.instructions = Webc.funMap2[fname].instructions;
            Webc.allVariables = [];
            Webc.varList = [];
            Webc.allList = [];
            Webc.oneList = Webc.funMap2[fname].oneList;
            Webc.twoList = Webc.funMap2[fname].twoList;
            Webc.varMap = Webc.funMap2[fname].varMap || {};
        } else {
            Webc.instructions = Webc.funMap[fname].instructions;
            Webc.allVariables = Webc.funMap[fname].allVariables;
            Webc.varList = Webc.funMap[fname].varList;
            Webc.allList = Webc.funMap[fname].allList;
            Webc.oneList = Webc.funMap[fname].oneList;
            Webc.twoList = Webc.funMap[fname].twoList;
            Webc.varMap = Webc.funMap[fname].varMap;
        }

        this.instructions = Webc.instructions;
        this.pc = 0;
    },

    returnFunc: function(instr) {
        var fname;

        if (instr.arg1) {
            if (!valueOf(instr.arg1)) {
                return;
            }
        }
        // alert('$$$ $$$' + JSON.stringify(instr.value));
        if (instr.value) {   
            this.returnValue = this.valueOf(instr.value);
        } 
        // alert('$$$ ' + JSON.stringify(this.returnValue));   
        this.callstack.pop();
        this.frame = this.callstack[this.callstack.length - 1];
        fname = this.frame.fname;

        Webc.instructions = Webc.funMap[fname].instructions;
        this.instructions = Webc.instructions;
        Webc.allVariables = Webc.funMap[fname].allVariables;
        Webc.varList = Webc.funMap[fname].varList;
        Webc.allList = Webc.funMap[fname].allList;
        Webc.oneList = Webc.funMap[fname].oneList;
        Webc.twoList = Webc.funMap[fname].twoList;
        Webc.varMap = Webc.funMap[fname].varMap;
        this.pc = this.frame.pc;
    },

    setVariable: function (name, value) {
        var val = this.checkValue('set variable', value);
        // alert('setVariable : ' + val);
        if (val === null) {
            return;
        }
        this.frame.variables[name] = Number(val);
        Webc.ckbox.update(Webc.ctxScratch2, false);
    },

    changeVariable: function (name, value) {
        var val = this.checkValue('change variable', value);
        if (val === null) {
            return;
        }
        if (this.frame.variables[name] !== undefined) {
            this.frame.variables[name] += Number(val);
        } else {
            generalAlert('there is no variable : ' + name 
                + '\nYou need to set ' + name + ' first.');
        }
        Webc.ckbox.update(Webc.ctxScratch2, false);
    },

    getVariable: function (name) {
        if (this.frame.variables[name] !== undefined) {
            return Number(this.frame.variables[name]);
        } else {
            generalAlert('there is no variable : ' + name 
                + '\nYou need to set ' + name + ' first.');
            return null;
        }
    },

    getVariable1: function (name) {
        var code;
        //alert('name = ' + name);
        code = parseExpr(name);
        //alert('code = ' + code);
        return this.valueOf(code);
    },

    initArray1: function (name, size, initvals) {
        var array,
            size1 = Number(this.checkValue('init array1', size)),
            x;
        if (size1 === null) {
            return;
        }
        array = { size: size1, b: [] };
        this.frame.variables[name] = array;
        if (Webc.oneList.indexOf(name) === -1) {
            Webc.oneList.push(name);
        }
        for (x = 0; x < size1; x += 1) {
            array.b.push(0);
        }
        if (initvals) {
            for (x = 0; x < initvals.length; x += 1) {
                array.b[x] = Number(initvals[x]);
            }
        }
        if (Webc.twoList.length === 0) {
            x = Webc.oneList.indexOf(name);
            if (x === 1 || x === Webc.oneList.length - 1) {
                Webc.drawBox1();
            }
        }
    },

    setArray1_: function (name, index, value) {
        var ix = index,
            val = value,
            array;
        array = this.frame.variables[name];
        if (this.callstack[array.frameId].variables[array.name]) {
            if (0 <= ix && ix < this.callstack[array.frameId].variables[array.name].size) {
                this.callstack[array.frameId].variables[array.name].b[ix] = val;
            } else {
                generalAlert('array index ' + ix + ' error');
            }
        } else {
            generalAlert('array ' + name + 'does not exist');            
        }
    },

    setArray1: function (name, index, value) {
        var ix,
            val;
        ix = this.checkValue('set array1 ' + name, index);
        if (ix === null) {
            return;
        }
        val = this.checkValue('set array1 ' + name, value);
        if (val === null) {
            return;
        }
        if (this.frame.variables[name]) {
            if (this.frame.variables[name].name) {
                // indirect array access
                this.setArray1_(name, ix, val);
            } else if (0 <= ix && ix < this.frame.variables[name].size) {
                this.frame.variables[name].b[ix] = val;
                Webc.printArray1(name, ix, val);
            } else {
                generalAlert('array index ' + ix + ' error');
            }
        } else {
            generalAlert('array ' + name + 'does not exist');            
        }
    },

    getArray1_: function (name, index, options) {
        var ix = index,
            array; 
        array = this.frame.variables[name];
        
        if (this.callstack[array.frameId].variables[array.name]) {
            if (0 <= ix && ix < this.callstack[array.frameId].variables[array.name].size) {
                return this.callstack[array.frameId].variables[array.name].b[ix];
            } else {
                generalAlert('array index ' + ix + ' error');
                return 0;
            }
        } else {
            generalAlert('array ' + array.name + 'does not exist');
            return 0;            
        }
    },

    getArray1: function (name, index, options) {
        var ix = this.checkValue('get array1 ' + name, index);
        if (ix === null) {
            return null;
        }
        if (this.frame.variables[name]) {
            if (this.frame.variables[name].name) {
                // indirect array access
                return this.getArray1_(name, ix);
            } else if (0 <= ix && ix < this.frame.variables[name].size) {
                return this.frame.variables[name].b[ix];
            } else {
                generalAlert('array index ' + ix + ' error');
                return 0;
            }
        } else {
            generalAlert('array ' + name + 'does not exist');
            return 0;            
        }
    },

    initArray2: function (name, size1, size2, options) {
        var array,
            sz1,
            sz2,
            x,
            y;

        sz1 = this.checkValue('init array2 ' + name, size1);
        if (sz1 === null) {
            return;
        }
        sz2 = this.checkValue('init array2 ' + name, size2);
        if (sz2 === null) {
            return;
        }
        array = { size1: sz1, size2: sz2, b: [] };
        this.frame.variables[name] = array;
        if (Webc.twoList.indexOf(name) === -1) {
            Webc.twoList.push(name);
        }        
        for (x = 0; x < sz1; x += 1) {
            array.b.push([]);
            for (y = 0; y < sz2; y += 1) {
                array.b[x].push(0);
            }
        }
        Webc.drawBox2(sz1, sz2);
        Webc.display2();
    },

    setArray2: function (name, index1, index2, value) {
        var ix1,
            ix2,
            val,
            sz1,
            sz2;
        ix1 = this.checkValue('set array2 ' + name, index1);
        if (ix1 === null) {
            return;
        }
        ix2 = this.checkValue('set array2 ' + name, index2);
        if (ix2 === null) {
            return;
        }
        val = this.checkValue('set array2 ' + name, value);
        if (val === null) {
            return;
        }

        if (this.frame.variables[name]) {
            sz1 = this.frame.variables[name].size1;
            sz2 = this.frame.variables[name].size2;
            if (0 <= ix1 && ix1 < sz1) {
                if (0 <= ix2 && ix2 < sz2) {
                    this.frame.variables[name].b[ix1][ix2] = val;
                    // show first array2 only.
                    if (Webc.twoList[0] === name) {
                        Webc.printArray2(val, sz1, sz2, ix1, ix2);
                    }
                } else {
                    generalAlert('array index2 ' + ix2 + ' error');
                }
            } else {
                generalAlert('array index1 ' + ix1 + ' error');
            }
        } else {
            generalAlert('array ' + name + 'does not exist');
        }
    },

    getArray2: function (name, index1, index2) {
        var ix1,
            ix2;
        ix1 = this.checkValue('get array2 ' + name, index1);
        if (ix1 === null) {
            return null;
        }
        ix2 = this.checkValue('get array2 ' + name, index2);
        if (ix2 === null) {
            return null;
        }
        if (this.frame.variables[name]) {
            if (0 <= ix1 && ix1 < this.frame.variables[name].size1) {
                if (0 <= ix2 && ix2 < this.frame.variables[name].size2) {
                    return this.frame.variables[name].b[ix1][ix2];
                } else {
                    generalAlert('array index2 ' + ix2 + ' error');
                    return 0;
                }
            } else {
                generalAlert('array index1 ' + ix1 + ' error');
                return 0;
            }
        } else {
            generalAlert('array ' + name + 'does not exist');
            return 0;
        }
    },

    getUnary: function (name, first) {
        var val = this.checkValue('unary operation: ' + name, first);
        if (val === null) {
            return val;
        }
        if (name === '-') {
            return -val;
        } else if (name === 'not') {
            return !val;
        } else {
            generalAlert('unknown unary operation ' + name);
            return null;
        }
    },

    getBinary: function (name, first, second) {
        var val1,
            val2;
        val1 = this.checkValue('binary operation: ' + name, first);
        if (val1 === null) {
            return null;
        }
        val2 = this.checkValue('binray operation: ' + name, second);
        if (val2 === null) {
            return null;
        }
        val1 = Number(val1);
        val2 = Number(val2);
        if (name === '+') {
            return val1 + val2;
        } else if (name === '-') {
            return val1 - val2;
        } else if (name === '*') {
            return val1 * val2;
        } else if (name === '/') {
            if (val2 === 0) {
                generalAlert('divisor is zero');
                return null;
            } else {
                return Math.floor(val1 / val2);
            }
        } else if (name === '%') {
            if (val2 === 0) {
                generalAlert('divisor is zero');
                return null;
            } else {
                return val1 % val2;
            }
        } else if (name === '&&') {
            return val1 && val2;
        } else if (name === '||') {
            return val1 || val2;
        } else if (name === '==') {
            return val1 === val2;
        } else if (name === '!=') {
            return val1 !== val2;
        } else if (name === '<') {
            return val1 < val2;
        } else if (name === '<=') {
            return val1 <= val2;
        } else if (name === '>') {
            return val1 > val2;
        } else if (name === '>=') {
            return val1 >= val2;
        } else if (name === 'rand') {
            return Math.floor(Math.random() * (val2 - val1 + 1) + val1);
        } else {
            generalAlert('unknown binary operation : ' + name);
            return null;
        }
    },

    valueOf: function (instr) {
        if (!instr || !instr.kind ) {
            generalAlert('unknown instruction formats(value of) ' + instr);
            return null;
        } 
        if (instr.kind === 1) { // math constant, logic constant, string
            return instr.value;
        } else if(instr.kind === 2) { // unary operation
            return this.getUnary(instr.name, instr.arg1);
        } else if(instr.kind === 3) { // binary operation
            return this.getBinary(instr.name, instr.arg1, instr.arg2);
        } else if(instr.kind === 4) { // getVariable
            return this.getVariable(instr.name);
        } else if(instr.kind === 5) { // getArray1
            return this.getArray1(instr.name, instr.arg1);
        } else if(instr.kind === 6) { // getArray2
            return this.getArray2(instr.name, instr.arg1, instr.arg2);
        } else if(instr.kind === 7) { // getVariable
            return this.getVariable1(instr.name);
        } else if(instr.kind === 8) { // return value retrieval from keyboard input,
            return this.returnValue;  // or function call
        } else if(instr.kind === 9) {
            return Math.floor(Math.random() * 11) % 11 + 5;
        } else {
            return null;
        }
    },

    checkValue: function (name, operand) {
        var val = this.valueOf(operand);
        if (val === null) {
            generalAlert('in instruction "' 
                + name + '" : bad part!!');
            return null;
        }
        return val;
    },

    nop: function () {
    },

    execute: function (instr) {
        if (!instr || !instr.kind) {
            BlocklyApps.storageAlert('unknown instruction formats(execute) ' + instr);
            return 0;
        } 
        if(instr.kind === 10) {
            this.suspend();           
            Webc.input(function(result) {
                Webc.vm.returnValue = Number(result);
                Webc.vm.resume();
            });
        } else if (instr.kind === 11) {
            // set variable
            this.setVariable(instr.name, instr.value);
        } else if (instr.kind === 12) { 
            // change variable
            this.changeVariable(instr.name, instr.value);
        } else if (instr.kind === 13) {
            // set Array1
            this.setArray1(instr.name, instr.arg1, instr.value);
        } else if (instr.kind === 14) { 
            // set Array2
            this.setArray2(instr.name, instr.arg1, instr.arg2, instr.value);
        } else if (instr.kind === 15) {
            // init Array1
            this.initArray1(instr.name, instr.arg1, instr.options);
        } else if (instr.kind === 16) { 
            // init Array2
            this.initArray2(instr.name, instr.arg1, instr.arg2, instr.options);            
        } else if (instr.kind === 17) { 
            // clear screen
            Webc.clearScreen();
        } else if (instr.kind === 18) { 
            // new line
            Webc.nextLine();
        } else if (instr.kind === 19) { 
            // print string
            Webc.print_str(instr.name);
        } else if (instr.kind === 20) { 
            var val = this.checkValue('print str times', instr.value);
            // print string times
            if (val !== null) {
                Webc.print_str_x(instr.name, val);
            }
        } else if (instr.kind === 21) {
            var val = this.checkValue('print4', instr.value);
            // print4 number
            if (val !== null) {
                Webc.print4(this.valueOf(instr.arg1), val);
            }
        } else if (instr.kind === 22) {
            var val = this.checkValue('print number', instr.value);
            // print number
            if (val !== null) {
                Webc.print_num(val);
            }
        } else if (instr.kind === 23) { 
            // pre repeat
            var nextInstr = this.instructions[this.pc],
                val = this.checkValue('repeat', instr.value);
            nextInstr.arg2 = val;
            nextInstr.arg1 = 0;
        } else if (instr.kind === 24) {
            // repeat header
            instr.arg1 += 1;
            if (instr.arg2 === null) {
                this.pc += instr.value;
            } else if (instr.arg1 > instr.arg2) {
                this.pc += instr.value;
            }
        } else if (instr.kind === 25) {
            // repeat footer
            this.pc -= (instr.value + 1);
        } else if (instr.kind === 26) {
            // while header
            var cond = this.checkValue('while', instr.arg1);
            if (cond === null || !cond) {
                this.pc += instr.value;
            }
        } else if (instr.kind === 27) {
            // while footer
            this.pc -= (instr.value + 1);
        } else if (instr.kind === 28) {
            // pre for
            if (this.frame.variables['_forIndexes']) {
                if (this.frame.variables['_forIndexes'].indexOf(instr.name) <  0) {
                    this.frame.variables['_forIndexes'].push(instr.name);
                } else {
                    generalAlert('in for loop "' 
                        + instr.name + '" : duplicating index!!');
                }
            } else {
                this.frame.variables['_forIndexes'] = [instr.name];
            }
            this.setVariable(instr.name, {kind: 1, value: 0});
        } else if (instr.kind === 29) {
            // for header
            var val = this.getVariable(instr.name),
                limit = this.checkValue('for', instr.arg1);
            if (limit === null) {
                this.pc += instr. value;
            } else if (val >= limit) {
                this.pc += instr.value;
                this.frame.variables['_forIndexes'].pop();
            }
        } else if (instr.kind === 30) {
            // for footer
            this.changeVariable(instr.name, {kind: 1, value: 1});
            this.pc -= (instr.value + 1);
        } else if (instr.kind === 31) {
            // if header
            var cond = this.checkValue('if', instr.arg1);
            if (!cond) {
                this.pc += instr.value;
            }
        } else if (instr.kind === 32) {
            // if footer
            this.nop();
        } else if (instr.kind === 33) {
            // ifELse header
            var cond = this.checkValue('ifElse', instr.arg1);
            if (!cond) {
                this.pc += instr.value;
            }
        } else if (instr.kind === 34) {
            // ifElse middle
            this.pc += instr.value;
        } else if (instr.kind === 35) {
            // ifElse footer
            this.nop();
        } else if (instr.kind === 36) {
            // Webc.startblock 
            this.nop();
        } else if (instr.kind === 37) {
            // Webc_get (ignore block)
            this.nop();
        } else if (instr.kind === 38) {
            this.callFunc(instr);
        } else if (instr.kind === 39) {
            this.glueFuncArgs(instr);
        } else if (instr.kind === 40) {
            this.returnFunc(instr);
        } else if (instr.kind === 41) {
            this.finishRun();
        } else if (instr.kind === 42) {
            this.waitForClick();
        } else {
            // error
            generalAlert('execute....ERROR....kind :: ' + instr.kind);
        }
    }
};


// C source code generation from Webc.instructions
function CodeGeneration() {
    this.pc = 0;            // for keyboard input processing
    this.stdlib = 0;        // for stdlib header
    this.srand = 0;         // for time header and srand
    this.level = 1;         // indentation
    this.loop = 1;          // used for repeat and string times index generation.
    this.tempVarList = [];  // used for repeat and string times index generation
    this.arr1List = [];
    this.arr2List = [];
    this.arr1src = '';
    this.arr2src = '';
    this.source = '';       // generated source code
};

CodeGeneration.prototype = {
    prefix : function() {
        var str = '',
            x;
        for (x = 0; x < this.level; x += 1) {
            str = str + '    ';
        }
        return str;
    },
    checkIndexName : function(name) {
        return Webc.allList.indexOf(name) < 0;
    },
    getIndexName : function() {
        var names = ['c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'x'],
            index,
            x;
        for (x = 0; x < names.length; x += 1) {
            index = names[x] + String(this.loop);
            if (this.checkIndexName(index)) {
                if (this.tempVarList.indexOf(index) < 0) {
                    this.tempVarList.push(index);
                }
                return index; 
            }
        }
        generalAlert('give up to generate proper index name');
        return 'index';
    },
    parseOptions : function(instr) {
        var size,
            x,
            str = '';
        if (instr.arg1.kind === 1) {
            size = instr.arg1.vlaue;
        } else {
            size = 100;
        }

        if (instr.options.length > size) {
            return ' ### the number of values is larger than array size.';
        }
        for (x = 0; x < instr.options.length; x += 1) {
            str += instr.options[x] + ', '
        }
        return str;
    },
    variablePart : function() {
        var x,
            src = '';
        for (x = 0; x < Webc.varList.length; x += 1) {
            src += '    int ' + Webc.varList[x] + ' = 0;\n';
        }

        for (x = 0; x < this.tempVarList.length; x += 1) {
            src += '    int ' + this.tempVarList[x] + ' = 0;\n';
        }
        return src;
    },
    stringOf : function (instr) {
        if (!instr || !instr.kind) {
            return 'undefined';
        } 
        if (instr.kind === 1) { // math constant, logic constant, string
            if (String(instr.value) === 'true') {
                return '1';
            } else if (String(instr.value) === 'false') {
                return '0';
            } else {
                return String(instr.value);
            }
        } else if (instr.kind === 2) { // unary operation
            return instr.name + this.stringOf(instr.arg1);
        } else if (instr.kind === 3) { // binary operation
            if (instr.name === 'rand') {
                this.stdlib = 1;
                this.srand = 1;
                if (this.stringOf(instr.arg1) === '1') {
                    return 'rand() % ' + this.stringOf(instr.arg2) + ' + 1';
                } else {
                    return 'rand() % (' + this.stringOf(instr.arg2) + ' - ' 
                        + this.stringOf(instr.arg1) + ' + 1) + '
                        + this.stringOf(instr.arg1);
                    }
            } else {
                return this.stringOf(instr.arg1) + instr.name + this.stringOf(instr.arg2);
            }
        } else if (instr.kind === 4) { // getVariable
            return instr.name;
        } else if (instr.kind === 5) { // getArray1
            return instr.name + '[' + this.stringOf(instr.arg1) + ']';
        } else if (instr.kind === 6) { // getArray2
            return instr.name + '[' + this.stringOf(instr.arg1) + ']['
                     + this.stringOf(instr.arg2) + ']';
        } else if (instr.kind === 7) { // getVariable
            return instr.name;
        } else if (instr.kind === 8) {
            var k = Webc.instructions[this.pc].kind;
            if (k !== 11 && k!==37) {
                return '## some error ##'
            }
            return '';  // special case for keyboard input
        } else if (instr.kind === 9) {
            // special care must be taken for rand function
            return 'rand() % 11 + 5'; 
        } else {
            return '';
        }
    },
    eatcode : function (instr) {
        if(instr.kind === 10) {
            var k = Webc.instructions[this.pc + 1].kind;
            if ( k === 37) {
                this.source += this.prefix() + 'getchar();\n';
            } else if (k === 11 || k === 13 || k === 14) {
                this.source += this.prefix()
                    + 'scanf(\"%d\", &';
            } else {
                this.source += this.prefix()
                    + '// keyboard input to set [variable or array]\n';
            }
        } else if (instr.kind === 11) {
            var k = Webc.instructions[this.pc - 1].kind;
            // set variable
            if (k === 10) {  // keyboard input
                this.source += instr.name + ');\n';
            } else {
                this.source += this.prefix() 
                    + instr.name + ' = ' + this.stringOf(instr.value) + ';\n';
            }
        } else if (instr.kind === 12) { 
            // change variable
            this.source += this.prefix() 
                + instr.name + ' += ' + this.stringOf(instr.value) + ';\n';
        } else if (instr.kind === 13) {
            var k = Webc.instructions[this.pc - 1].kind;
            // set Array1
            if (k === 10) {  // keyboard input
                this.source += instr.name 
                    + '[' + this.stringOf(instr.arg1) + ']);\n';
            } else {
            // set Array1
                this.source += this.prefix() 
                    + instr.name + '[' + this.stringOf(instr.arg1) + '] = '
                    + this.stringOf(instr.value) + ';\n';
            }
        } else if (instr.kind === 14) { 
            var k = Webc.instructions[this.pc - 1].kind;
            // set Array2
            if (k === 10) {  // keyboard input
                this.source += instr.name
                    + '[' + this.stringOf(instr.arg1) + ']['
                    + this.stringOf(instr.arg2) + ']);\n'; 
            } else {
            // set Array2
                this.source += this.prefix() 
                    + instr.name + '[' + this.stringOf(instr.arg1) + ']['
                    + this.stringOf(instr.arg2) + '] = ' 
                    + this.stringOf(instr.value) +';\n';
            }
        } else if (instr.kind === 15) {
            // init Array1
            if (this.arr1List.indexOf(instr.name) >= 0) {
                this.arr1src += '    // ' + instr.name + ' is duplicated array name \n';
                return;
            } 
            this.arr1List.push(instr.name);
            this.arr1src += '    int ' + instr.name + '['
                + ((instr.arg1.kind === 1) ? String(instr.arg1.value) : '100')
                + '] = {'
                + ((instr.options === undefined) ? 
                    '0,};\n' 
                    : 
                    this.parseOptions(instr) + '};\n'
                );
        } else if (instr.kind === 16) { 
            // init Array2
            if (this.arr2List.indexOf(instr.name) >= 0) {
                this.arr2src += '    // ' + instr.name + ' is duplicated array name \n';
                return;
            } 
            this.arr2List.push(instr.name);
            this.arr2src += '    int ' + instr.name + '['
                + ((instr.arg1.kind === 1) ? String(instr.arg1.value) : '20')
                + ']['
                + ((instr.arg2.kind === 1) ? String(instr.arg2.value) : '20')
                + '] = {0,};\n';
        } else if (instr.kind === 17) { 
            // clear screen
            this.stdlib = 1;
            this.source += this.prefix() + 'system(\"cls\"); // you may erase this line.\n';
        } else if (instr.kind === 18) { 
            // new line
            this.source += this.prefix() + 'printf(\"\\n\");\n';
        } else if (instr.kind === 19) { 
            // print string
            this.source += this.prefix() + 'printf(\"' + instr.name + '\");\n';
        } else if (instr.kind === 20) { 
            // print string timies
            var indexName;
            indexName = this.getIndexName();
            this.source += this.prefix()
                + 'for(' + indexName + ' = 0; ' 
                + indexName + ' < ' + this.stringOf(instr.value) + '; '
                + indexName + ' += 1) {\n'
                + this.prefix() + '    printf(\"' + instr.name + '\");\n'
                + this.prefix() + '};\n';
        } else if (instr.kind === 21) {
            // print format number
            this.source += this.prefix() 
                + 'printf(\"%' + this.stringOf(instr.arg1) + 'd\", ' 
                + this.stringOf(instr.value) + ');\n';
        } else if (instr.kind === 22) {
            // print number
            this.source += this.prefix() + 'printf(\"%d\", ' 
                + this.stringOf(instr.value) + ');\n';
        } else if (instr.kind === 23) { 
            // pre repeat
            var indexName;
            indexName = this.getIndexName();
            this.source += this.prefix()
                + 'for(' + indexName + ' = 0; ' 
                + indexName + ' < ' + this.stringOf(instr.value) + '; '
                + indexName + ' += 1) {\n';
        } else if (instr.kind === 24) {
            // repeat header
            this.level += 1;
            this.loop += 1;
        } else if (instr.kind === 25) {
            // repeat footer
            this.level -= 1;
            this.loop -= 1;
            this.source += this.prefix() + '};\n';
        } else if (instr.kind === 26) {
            // while header
            this.source += this.prefix() 
                + 'while(' + this.stringOf(instr.arg1)
                + ') {\n';
            this.level += 1;
        } else if (instr.kind === 27) {
            // while footer
            this.level -= 1;
            this.source += this.prefix() + '};\n';
        } else if (instr.kind === 28) {
            // pre for
            // do nothing
        } else if (instr.kind === 29) {
            // for header
            this.source += this.prefix()
                + 'for(' + instr.name + ' = 0; ' 
                + instr.name + ' < ' + this.stringOf(instr.arg1) + '; '
                + instr.name + ' += 1) {\n';
            this.level += 1;
        } else if (instr.kind === 30) {
            // for footer
            this.level -= 1;
            this.source += this.prefix() + '};\n';
        } else if (instr.kind === 31) {
            // if header
            this.source += this.prefix() 
                + 'if(' + this.stringOf(instr.arg1) + ') {\n';
            this.level += 1;
        } else if (instr.kind === 32) {
            // if footer
            this.level -= 1;
            this.source += this.prefix() + '};\n';
        } else if (instr.kind === 33) {
            // ifELse header
            this.source += this.prefix()
                + 'if(' + this.stringOf(instr.arg1) + ') {\n';
            this.level += 1;
        } else if (instr.kind === 34) {
            // ifElse middle
            this.level -= 1;
            this.source += this.prefix() + '} else {\n';
            this.level += 1;
        } else if (instr.kind === 35) {
            // ifElse footer
            this.level -= 1;
            this.source += this.prefix() + '};\n';
        } else if (instr.kind === 36) {
            // Webc.startblock
        } else if (instr.kind === 37) {
            // Webc.startblock
            if (instr.value && instr.value.kind !== 8) {
                this.source += this.prefix() + this.stringOf(instr.value) + ';\n';
            }
        } else if (instr.kind === 38) { 
            // this.callFunc(instr);
        } else if (instr.kind === 39) {
            // this.glueFuncArgs(instr);
        } else if (instr.kind === 40) {
            // this.returnFunc(instr);
        } else if (instr.kind === 41) {
            // this.finishRun();
        } else {
            // error
            generalAlert('source generation....ERROR....kind :: ' + instr.kind);
        }
    },
    generate : function() {
        var i,
            instr;
        for (i = 0; i < Webc.instructions.length; i += 1) {
            instr = Webc.instructions[i];
            this.pc = i;
            this.eatcode(instr);
        }
        return '#include <stdio.h>\n'
            + ((this.stdlib || this.srand) ? '#include <stdlib.h>\n' : '')
            + ((this.srand) ? '#include <time.h>\n' : '')
            + 'int main() {\n'
            + this.arr2src
            + this.arr1src
            + this.variablePart()
            + ((this.srand) ? '    srand(time(NULL));\n' : '')
            + this.source
            + '    return 0;\n'
            + '}\n';
    }
};

// checkbox 

function CheckBox(x, y) {
    this.x = x;
    this.y = y;
    this.width = 12;
    this.height = 12;
    this.checked = true;
    this.clicked = false;
    this.hovered = false;
};

CheckBox.prototype.update = function(ctx, yes) {
    var allkeys,
        i,
        name;
    if (yes) {
        this.checked = !this.checked;
    } 
    this.draw(ctx);

    if (!this.checked) {
        Webc.display3();
        return;
    }
    allkeys = Object.keys(Webc.varMap);
    for (i = 0; i < allkeys.length; i += 1) {
        name = allkeys[i];
        Webc.varDraw(name, ctx);
    }
    Webc.display3();
};

CheckBox.prototype.draw = function(ctx) {
    ctx.fillStyle = "#f8f8f8";
    ctx.fillRect( 0, 0, Webc.WIDTH, 120);  

    ctx.lineWidth = 1;
    ctx.strokeRect(this.x+0.5, this.y+0.5, this.width, this.height);
    ctx.fillStyle = '#000000';

    ctx.font = "14px sans-serif";
    ctx.fillText('show all variables', this.x + 20, this.y+10);

    //draw check or x
    ctx.font = "8px sans-serif";
    if (this.checked) {
        ctx.lineWidth = 2;
        ctx.fillStyle = "#111111";
        ctx.fillText("\u2713", this.x+3, this.y+10);
    } 
};

CheckBox.prototype.intersects = function(mouse) {
    var t = 5, //tolerance
        xIntersect,
        yIntersect;
    xIntersect = (mouse.x + this.width + t) > this.x && this.x > (mouse.x - this.width);
    yIntersect = (mouse.y + this.height + t) > this.y && this.y > (mouse.y - this.height);
    return  xIntersect && yIntersect;
};
