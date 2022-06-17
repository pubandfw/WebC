// This file was automatically generated from common.soy.
// Please don't edit this file by hand.

if (typeof apps == 'undefined') { var apps = {}; }


apps.messages = function(opt_data, opt_ignored, opt_ijData) {
  return '<div style="display: none"><span id="subtitle">a visual programming environment</span><span id="blocklyMessage">Blockly</span><span id="codeTooltip">See generated C source code.</span><span id="linkTooltip">Save and link to blocks.</span><span id="runTooltip">Run the program defined by the blocks in the workspace.</span><span id="runProgram">Run Program</span><span id="resetProgram">Reset</span><span id="dialogOk">OK</span><span id="dialogCancel">Cancel</span><span id="catLogic">Logic</span><span id="catLoops">Loops</span><span id="catMath">Math</span><span id="catText">Text</span><span id="catArrays">Arrays</span><span id="catVariables">Variables</span><span id="catProcedures">Functions</span><span id="httpRequestError">There was a problem with the request.</span><span id="linkAlert">Share your blocks with this link:\n\n%1</span><span id="hashError">Sorry, \'%1\' doesn\'t correspond with any saved program.</span><span id="xmlError">Could not load your saved file.  Perhaps it was created with a different version of Blockly?</span><span id="textVariable">text</span></div>';
};


apps.dialog = function(opt_data, opt_ignored, opt_ijData) {
  return '<div id="dialogShadow" class="dialogAnimate"></div><div id="dialogBorder"></div><div id="dialog"></div>';
};


apps.codeDialog = function(opt_data, opt_ignored, opt_ijData) {
  return '<div id="dialogCode" class="dialogHiddenContent"><pre id="containerCode"></pre>' + apps.ok(null, null, opt_ijData) + '</div>';
};


apps.storageDialog = function(opt_data, opt_ignored, opt_ijData) {
  return '<div id="dialogStorage" class="dialogHiddenContent"><div id="containerStorage"></div>' + apps.ok(null, null, opt_ijData) + '</div>';
};


apps.ok = function(opt_data, opt_ignored, opt_ijData) {
  return '<div class="farSide" style="padding: 1ex 3ex 0"><button class="secondary" onclick="BlocklyApps.hideDialog(true)">OK</button></div>';
};

;
// This file was automatically generated from template.soy.
// Please don't edit this file by hand.

if (typeof webcpage == 'undefined') { var webcpage = {}; }


webcpage.messages = function(opt_data, opt_ignored, opt_ijData) {
  return apps.messages(null, null, opt_ijData) + '<div style="display: none"><span id="webc_doCode">do</span><span id="webc_elseCode">else</span><span id="webc_clearScreen">clear screen</span><span id="webc_printHelpUrl">https://en.wikipedia.org/wiki/Printing</span><span id="webc_printTooltip">Draws text in the turtle\'s direction at its location.</span><span id="webc_print">print</span><span id="webc_unloadWarning">Leaving this page will result in the loss of your work.</span></div>';
};


webcpage.start = function(opt_data, opt_ignored, opt_ijData) {
  return webcpage.messages(null, null, opt_ijData) + '<table width="100%"><tr><td width="320"><h1><span id="title"><a href="https://code.google.com/p/blockly/?lang=' + soy.$$escapeHtml(opt_ijData.lang) + '">Blockly</a> : web c language</span></h1></td><td width="200"><button id ="screenButton" title="change to console">console</button><button id="arrayButton" title="change to array show">array</button></td><td><button id="codeButton" title="See generated C source code.">code</button></td><td><button id="linkButton" title="Save and link to blocks."><img src=\'../../media/1x1.gif\' class="link icon21"></button></td><td style="width: 190px; text-align: center"><button id="runButton" class="primary" title="Makes the turtle do what the blocks say."><img src="../../media/1x1.gif" class="run icon21">Run</button></td><td><button id="resetButton" class="primary"><img src="../../media/1x1.gif" class="stop icon21">Reset</button></td><td class="farSide"><select id="languageMenu"></select></td></tr></table><div id="visualization"><canvas id="scratch" width="480" height="480" style="display: none"></canvas><canvas id="arrays" width="480" height="480" style="display: none"></canvas><canvas id="display" width="480" height="480"></canvas><br /><canvas id="variables" width="480" height="120"></canvas><canvas id="scratch2" width="480" height="120" style="display: none"></canvas></div><script type="text/javascript" src="../../blockly_compressed.js"><\/script><script type="text/javascript" src="../../blocks_compressed.js"><\/script><script type="text/javascript" src="../../' + soy.$$escapeHtml(opt_ijData.langSrc) + '"><\/script><script type="text/javascript" src="blocks.js"><\/script>' + webcpage.toolbox(null, null, opt_ijData) + '<div id="blockly"></div>' + apps.dialog(null, null, opt_ijData) + apps.codeDialog(null, null, opt_ijData) + apps.storageDialog(null, null, opt_ijData);
};


webcpage.toolbox = function(opt_data, opt_ignored, opt_ijData) {
  return '<xml id="toolbox" style="display: none"><category name="Console"><block type="webc_print4"></block><block type="webc_print_num"></block><block type="webc_clear_screen"></block><block type="webc_print_newline"></block><block type="webc_print_str"><value name="TEXT"><block type="text" movable="false"></block></value></block><block type="webc_print_str_times"><value name="TEXT"><block type="text" movable="false"></block></value></block><block type="webc_get"></block><block type="click_console_button"></block><block type="webc_keyboard_input"></block><block type="webc_random_input"></block></category><category name="Logic"><block type="webc_if"></block><block type="webc_ifElse"></block><block type="webc_logic_compare"></block><block type="webc_logic_operation"></block><block type="webc_logic_negate"></block><block type="webc_logic_boolean"></block></category><category name="Loops"><block type="webc_repeat"><value name="TIMES"><block type="webc_math_number"><field name="NUM">10</field></block></value></block><block type="webc_while"></block><block type="webc_for"><value name="FROM"><block type="webc_math_number" movable="false" editable="false" deletable="false"><field name="NUM">0</field></block></value><value name="TO"><block type="webc_math_number"><field name="NUM">10</field></block></value></block></category><category name="Math"><block type="webc_math_number"></block><block type="webc_math_arithmetic"></block><block type="webc_math_change"><value name="DELTA"><block type="webc_math_number"><field name="NUM">1</field></block></value></block><block type="webc_variables_get_1"></block><block type="webc_math_random_int"><value name="FROM"><block type="webc_math_number"><field name="NUM">1</field></block></value><value name="TO"><block type="webc_math_number"><field name="NUM">100</field></block></value></block></category><category name="Arrays"><category name="one"><block type="webc_array_one_resize_"></block><block type="webc_array_one_get"></block><block type="webc_array_one_set"></block></category><category name="two"><block type="webc_array_two_resize"></block><block type="webc_array_two_get"></block><block type="webc_array_two_set"></block></category></category><category name="Variables" custom="VARIABLE"><block type="webc_variables_get"></block><block type="webc_variables_set"></block></category><category name="Problems"><block type="problem_set_1"></block><block type="problem_set_2"></block><block type="problem_set_3"></block><block type="problem_set_4"></block></category><category name="Functions" custom="PROCEDURE"></category></xml>';
};
