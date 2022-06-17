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


// Create a namespace.
var BlocklyStorage = {};

/**
 * Save blocks to localStroage return retrieves blocks from localStorage.
 */
BlocklyStorage.link = function() {
  var xml,
      data;

  if (BlocklyStorage.isChanged()) {
    xml = Blockly.Xml.workspaceToDom(Blockly.getMainWorkspace());
    data = Blockly.Xml.domToText(xml);
    localStorage.setItem('_webc_', data);
  } else {
    data = localStorage.getItem('_webc_');
    if (data) {
      xml = Blockly.Xml.textToDom(data);
      Blockly.getMainWorkspace().clear();
      Blockly.Xml.domToWorkspace(Blockly.getMainWorkspace(), xml);
      BlocklyStorage.fixStartButton();
    }
  }
};

BlocklyStorage.isChanged = function() {
  var xmlDom = Blockly.Xml.workspaceToDom(Blockly.getMainWorkspace());
  var xmlText = Blockly.Xml.domToText(xmlDom);
  if (Webc.startXmlText != xmlText) {
    return true;
  } else {
    return false;
  }
};

BlocklyStorage.fixStartButton = function() {
    var blocks,
        x,
        block,
        code,
        name;
    blocks = Blockly.mainWorkspace.getTopBlocks(true);
    for (x = 0; block = blocks[x]; x += 1) {
        if (block.type === 'webc_start') {
          Webc.startblock = block;
        }
    }
};
/**
 * Present a text message to the user.
 */
BlocklyStorage.alert = function(message) {
  window.alert(message);
};


/**
 * Class for a array's dropdown field.
 * @param {?string} varname The default name for the array.  
 * @param {Function} opt_changeHandler A function that is executed when a new
 *     option is selected.  Its sole argument is the new option value.  Its
 *     return value is ignored.
 * @extends {Blockly.FieldDropdown}
 * @constructor
 */
Blockly.FieldArray = function(varname, opt_changeHandler) {
  var changeHandler,
      dim = Blockly.FieldArray.getDimension(varname);
  if (opt_changeHandler) {
    // Wrap the user's change handler together with the variable rename handler.
    var thisObj = this;
    changeHandler = function(value) {
      var retVal = Blockly.FieldArray.dropdownChange_[dim].call(thisObj, value);
      var newVal;
      if (retVal === undefined) {
        newVal = value;  // Existing variable selected.
      } else if (retVal === null) {
        newVal = thisObj.getValue();  // Abort, no change.
      } else {
        newVal = retVal;  // Variable name entered.
      }
      opt_changeHandler.call(thisObj, newVal);
      return retVal;
    };
  } else {
    changeHandler = Blockly.FieldArray.dropdownChange_[dim];
  }

  Blockly.FieldArray.superClass_.constructor.call(this,
      Blockly.FieldArray.dropdowns_[dim], changeHandler);

  if (varname) {
    this.setValue(varname);
  } else {
    this.setValue(Blockly.Variables.generateUniqueName());
  }
};
goog.inherits(Blockly.FieldArray, Blockly.FieldDropdown);

/**
 * Clone this FieldVariable.
 * @return {!Blockly.FieldVariable} The result of calling the constructor again
 *   with the current values of the arguments used during construction.
 */
Blockly.FieldArray.prototype.clone = function() {
  return new Blockly.FieldArray(this.getValue(), this.changeHandler_);
};

/**
 * Get the variable's name (use a variableDB to convert into a real name).
 * Unline a regular dropdown, variables are literal and have no neutral value.
 * @return {string} Current text.
 */
Blockly.FieldArray.prototype.getValue = function() {
  return this.getText();
};

/**
 * Set the variable name.
 * @param {string} text New text.
 */
Blockly.FieldArray.prototype.setValue = function(text) {
  this.value_ = text;
  this.setText(text);
};

Blockly.FieldArray.getDimension = function(text) {
  return (text === 'arr2') ? 2 : 1;
};

Blockly.FieldArray.allowedName0 = function(text) {
  var allarr1 = Blockly.Variables.allArrays(1),
      allarr2 = Blockly.Variables.allArrays(2),
      x, 
      ch;
  if (text === 'arr1') return false;
  if (text === 'arr2') return false;
  for (x = 0; x < allarr1.length; x += 1) {
    if (text === allarr1[x]) break;
  }
  if (x < allarr1.length) return false;
  for (x = 0; x < allarr2.length; x += 1) {
    if (text === allarr2[x]) break;
  }
  if (x < allarr2.length) return false;
  if (! /^[a-zA-Z0-9_]+$/.test(text)) {
    return false;
  }
  if ('0' <= text.charAt(0) && text.charAt(0) <= '9') {
    return false;
  }
  return true;
};

Blockly.FieldArray.allowedName1 = function(text) {
  var allarr2 = Blockly.Variables.allArrays(2),
      allvars = Blockly.Variables.allVariables(),
      x;
  if (text === 'item') return false;
  if (text === 'arr2') return false;
  for (x = 0; x < allarr2.length; x += 1) {
    if (text === allarr2[x]) break;
  }
  if (x < allarr2.length) return false;
  for (x = 0; x < allvars.length; x += 1) {
    if (text === allvars[x]) break;
  }
  if (x < allvars.length) return false;  
  if (! /^[a-zA-Z0-9_]+$/.test(text)) {
    return false;
  }
  if ('0' <= text.charAt(0) && text.charAt(0) <= '9') {
    return false;
  }
  return true;
};

Blockly.FieldArray.allowedName2 = function(text) {
  var allarr1 = Blockly.Variables.allArrays(1),
      allvars = Blockly.Variables.allVariables(),
      x;
  if (text === 'item') return false;
  if (text === 'arr1') return false;
  for (x = 0; x < allarr1.length; x += 1) {
    if (text === allarr1[x]) break;
  }
  if (x < allarr1.length) return false;
  for (x = 0; x < allvars.length; x += 1) {
    if (text === allvars[x]) break;
  }
  if (x < allvars.length) return false;  
  if (! /^[a-zA-Z0-9_]+$/.test(text)) {
    return false;
  }
  if ('0' <= text.charAt(0) && text.charAt(0) <= '9') {
    return false;
  }
  return true;
};

/**
 * Return a sorted list of variable names for variable dropdown menus.
 * Include a special option at the end for creating a new variable name.
 * @return {!Array.<string>} Array of variable names.
 * @this {!Blockly.FieldVariable}
 */
Blockly.FieldArray.dropdownCreate1 = function() {
  var variableList = Blockly.Variables.allArrays(1);
  // Ensure that the currently selected variable is an option.
  var name = this.getText();
  if (name && variableList.indexOf(name) == -1) {
    variableList.push(name);
  }
  variableList.sort(goog.string.caseInsensitiveCompare);
  variableList.push(Blockly.Msg.RENAME_ARRAY);
  variableList.push(Blockly.Msg.NEW_ARRAY);
  // Variables are not language-specific, use the name as both the user-facing
  // text and the internal representation.
  var options = [];
  for (var x = 0; x < variableList.length; x++) {
    options[x] = [variableList[x], variableList[x]];
  }
  return options;
};

Blockly.FieldArray.dropdownCreate2 = function() {
  var variableList = Blockly.Variables.allArrays(2);
  // Ensure that the currently selected variable is an option.
  var name = this.getText();
  if (name && variableList.indexOf(name) == -1) {
    variableList.push(name);
  }
  variableList.sort(goog.string.caseInsensitiveCompare);
  variableList.push(Blockly.Msg.RENAME_ARRAY);
  variableList.push(Blockly.Msg.NEW_ARRAY);
  // Variables are not language-specific, use the name as both the user-facing
  // text and the internal representation.
  var options = [];
  for (var x = 0; x < variableList.length; x++) {
    options[x] = [variableList[x], variableList[x]];
  }
  return options;
};

Blockly.FieldArray.dropdowns_ = [
  undefined,
  Blockly.FieldArray.dropdownCreate1,
  Blockly.FieldArray.dropdownCreate2];



/**
 * Event handler for a change in variable name.
 * Special case the 'New variable...' and 'Rename variable...' options.
 * In both of these special cases, prompt the user for a new name.
 * @param {string} text The selected dropdown menu option.
 * @return {null|undefined|string} An acceptable new variable name, or null if
 *     change is to be either aborted (cancel button) or has been already
 *     handled (rename), or undefined if an existing variable was chosen.
 * @this {!Blockly.FieldVariable}
 */
Blockly.FieldVariable.dropdownChange = function(text) {
  function promptName(promptText, defaultText) {
    Blockly.hideChaff();
    var newVar = window.prompt(promptText, defaultText);
    // Merge runs of whitespace.  Strip leading and trailing whitespace.
    // Beyond this, all names are legal.
    return newVar && newVar.replace(/[\s\xa0]+/g, ' ').replace(/^ | $/g, '');
  }
  if (text == Blockly.Msg.RENAME_VARIABLE) {
    var oldVar = this.getText();
    text = promptName(Blockly.Msg.RENAME_VARIABLE_TITLE.replace('%1', oldVar),
                      oldVar);
    if (text) {
      if (Blockly.FieldArray.allowedName0(text)) {
        Blockly.Variables.renameVariable(oldVar, text); 
      } else {
        generalAlert('You may not use that variable name.');
      }
    }
    return null;
  } else if (text == Blockly.Msg.NEW_VARIABLE) {
    text = promptName(Blockly.Msg.NEW_VARIABLE_TITLE, '');
    // Since variables are case-insensitive, ensure that if the new variable
    // matches with an existing variable, the new case prevails throughout.
    if (text) {
      if (Blockly.FieldArray.allowedName0(text)) {
        Blockly.Variables.renameVariable(text, text);  
      } else {
        generalAlert('You may not use that variable name.');
        return null;
      }
      return text;
    }
    return null;
  }
  return undefined;
};

/**
 * Event handler for a change in variable name.
 * Special case the 'New variable...' and 'Rename variable...' options.
 * In both of these special cases, prompt the user for a new name.
 * @param {string} text The selected dropdown menu option.
 * @return {null|undefined|string} An acceptable new variable name, or null if
 *     change is to be either aborted (cancel button) or has been already
 *     handled (rename), or undefined if an existing variable was chosen.
 * @this {!Blockly.FieldVariable}
 */
Blockly.FieldArray.dropdownChange1 = function(text) {
  function promptName(promptText, defaultText) {
    Blockly.hideChaff();
    var newVar = window.prompt(promptText, defaultText);
    // Merge runs of whitespace.  Strip leading and trailing whitespace.
    // Beyond this, all names are legal.
    return newVar && newVar.replace(/[\s\xa0]+/g, ' ').replace(/^ | $/g, '');
  }
  if (text == Blockly.Msg.RENAME_ARRAY) {
    var oldVar = this.getText();
    text = promptName(Blockly.Msg.RENAME_ARRAY_TITLE.replace('%1', oldVar),
                      oldVar);
    if (text) {
      if (Blockly.FieldArray.allowedName1(text)) {
        Blockly.Variables.renameArray(oldVar, text);      
      } else {
        generalAlert('You may not use that array name.');
      }
    }
    return null;
  } else if (text == Blockly.Msg.NEW_ARRAY) {
    text = promptName(Blockly.Msg.NEW_ARRAY_TITLE, '');
    // Since variables are case-insensitive, ensure that if the new variable
    // matches with an existing variable, the new case prevails throughout.
    if (text) {
      if (Blockly.FieldArray.allowedName1(text)) {
        Blockly.Variables.renameArray(text, text);      
      } else {
        generalAlert('You can not use that array name.');
        return null;
      }
      return text;
    }
    return null;
  }
  return undefined;
};

Blockly.FieldArray.dropdownChange2 = function(text) {
  function promptName(promptText, defaultText) {
    Blockly.hideChaff();
    var newVar = window.prompt(promptText, defaultText);
    // Merge runs of whitespace.  Strip leading and trailing whitespace.
    // Beyond this, all names are legal.
    return newVar && newVar.replace(/[\s\xa0]+/g, ' ').replace(/^ | $/g, '');
  }
  if (text == Blockly.Msg.RENAME_ARRAY) {
    var oldVar = this.getText();
    text = promptName(Blockly.Msg.RENAME_ARRAY_TITLE.replace('%1', oldVar),
                      oldVar);
    if (text) {
      if (Blockly.FieldArray.allowedName2(text)) {
        Blockly.Variables.renameArray(oldVar, text);      
      } else {
        generalAlert('You may not use that array name.');
        return null;
      }
    }
    return null;
  } else if (text == Blockly.Msg.NEW_ARRAY) {
    text = promptName(Blockly.Msg.NEW_ARRAY_TITLE, '');
    // Since variables are case-insensitive, ensure that if the new variable
    // matches with an existing variable, the new case prevails throughout.
    if (text) {
      if (Blockly.FieldArray.allowedName2(text)) {
        Blockly.Variables.renameArray(text, text);      
      } else {
        generalAlert('You may not use that array name.');
        return null;
      }
      return text;
    }
    return null;
  }
  return undefined;
};

Blockly.FieldArray.dropdownChange_ = [
  undefined,
  Blockly.FieldArray.dropdownChange1,
  Blockly.FieldArray.dropdownChange2];
/**
 * Category to separate variable names from procedures and generated functions.
 */

/**
 * Find all user-created arrays.
 * @param {Blockly.Block=} opt_block Optional root block.
 * @return {!Array.<string>} Array of variable names.
 */
Blockly.Variables.allArrays = function(dim, opt_block) {
  var blocks,
      cond,
      func,
      x,
      y,
      varName,
      name,
      blockVariables,
      variableHash,
      variableList = [];
  if (opt_block) {
    blocks = opt_block.getDescendants();
  } else {
    blocks = Blockly.mainWorkspace.getAllBlocks();
  }
  variableHash = Object.create(null);
  // Iterate through every block and add each variable to the hash.
  for (x = 0; x < blocks.length; x++) {
    func = blocks[x].getArrs;
    cond = (func) ? (3 === dim || dim === blocks[x].dim) : false;
    if (cond) {
      blockVariables = func.call(blocks[x]);
      for (y = 0; y < blockVariables.length; y++) {
        varName = blockVariables[y];
        // Variable name may be null if the block is only half-built.
        if (varName) {
          variableHash[varName.toLowerCase()] = varName;
        }
      }
    }
  }
  // Flatten the hash into a list.
  for (name in variableHash) {
    variableList.push(variableHash[name]);
  }
  return variableList;
};

/**
 * Find all instances of the specified variable and rename them.
 * @param {string} oldName Variable to rename.
 * @param {string} newName New variable name.
 */
Blockly.Variables.renameArray = function(oldName, newName) {
  var blocks = Blockly.mainWorkspace.getAllBlocks();
  // Iterate through every block.
  for (var x = 0; x < blocks.length; x++) {
    var func = blocks[x].renameArr;
    if (func) {
      func.call(blocks[x], oldName, newName);
    }
  }
};

/**
 * Show the user's code in raw JavaScript.
 * @param {!Event} e Mouse or touch event.
 */
BlocklyApps.showCode = function(e) {
    var origin = e.target,
        cg,
        code,
        pre,
        content,
        style;

    Webc.funMap = {};
    Webc.instructions = null;
    Webc.allVariables = null;
    Webc.varList = null;
    Webc.allList = null;

    Webc.workspaceToCode(Webc.startblock); // to Webc.instructions
    Webc.addVarMap();      // Webc.varMap creation

    Webc.instructions = Webc.funMap['_main_'].instructions;
    Webc.allVariables = Webc.funMap['_main_'].allVariables;
    Webc.varMap = Webc.funMap['_main_'].varMap;
    Webc.varList = Webc.funMap['_main_'].varList;
    Webc.allList = Webc.funMap['_main_'].allList;

    cg = new CodeGeneration();
    code = cg.generate();   // from Webc.instructions

    pre = document.getElementById('containerCode');
    pre.textContent = code;
    if (typeof prettyPrintOne == 'function') {
        code = pre.innerHTML;
        code = prettyPrintOne(code, 'js');
        pre.innerHTML = code;
    }

  content = document.getElementById('dialogCode');
  style = {
      width: '40%',
      left: '30%',
      top: '5em'
  };
  BlocklyApps.showDialog(content, origin, true, true, style,
      BlocklyApps.stopDialogKeyDown);
  BlocklyApps.startDialogKeyDown();
};


// console keyboard input

Blockly.Blocks['webc_keyboard_input'] = {
  /**
   * Block for numeric value.
   * @this Blockly.Block
   */
  init: function() {
    this.setHelpUrl(Blockly.Msg.MATH_NUMBER_HELPURL);
    this.setColour(330);
    this.appendDummyInput()
        .appendField('keyboard input');
    this.setOutput(true, 'Number');
    this.setTooltip(Blockly.Msg.MATH_NUMBER_TOOLTIP);
  }
};

// keyboard input
Webc['webc_keyboard_input'] = function(block) {
    Webc.instructions.push({ kind: 10 });
    return { kind: 8, id: block.id };
};

// random input

Blockly.Blocks['webc_random_input'] = {
  /**
   * Block for numeric value.
   * @this Blockly.Block
   */
  init: function() {
    this.setHelpUrl(Blockly.Msg.MATH_NUMBER_HELPURL);
    this.setColour(330);
    this.appendDummyInput()
        .appendField('random input');
    this.setOutput(true, 'Number');
    this.setTooltip(Blockly.Msg.MATH_NUMBER_TOOLTIP);
  }
};

// random input
Webc['webc_random_input'] = function(block) {
    return { kind: 9, id: block.id };
};
// Extensions to Blockly's language and JavaScript generator.

Blockly.Blocks['webc_math_number'] = {
  /**
   * Block for numeric value.
   * @this Blockly.Block
   */
  init: function() {
    this.setHelpUrl(Blockly.Msg.MATH_NUMBER_HELPURL);
    this.setColour(230);
    this.appendDummyInput()
        .appendField(new Blockly.FieldTextInput('0',
        Blockly.FieldTextInput.numberValidator), 'NUM');
    this.setOutput(true, 'Number');
    this.setTooltip(Blockly.Msg.MATH_NUMBER_TOOLTIP);
  }
};

Webc['webc_math_number'] = function(block) {
    // Numeric value.
    var val = block.getFieldValue('NUM');
    //alert('NUMBER GOT IT ' + value);
    return { kind: 1, value: val, id: block.id } ;
};

Blockly.Blocks['webc_math_arithmetic'] = {
  /**
   * Block for basic arithmetic operator.
   * @this Blockly.Block
   */
  init: function() {
    var OPERATORS =
        [['+', 'ADD'],
         ['-', 'MINUS'],
         ['*', 'MULTIPLY'],
         ['/', 'DIVIDE'],
         ['%', 'MODULO']];
    this.setHelpUrl(Blockly.Msg.MATH_ARITHMETIC_HELPURL);
    this.setColour(230);
    this.setOutput(true, 'Number');
    this.appendValueInput('A')
        .setCheck('Number');
    this.appendValueInput('B')
        .setCheck('Number')
        .appendField(new Blockly.FieldDropdown(OPERATORS), 'OP');
    this.setInputsInline(true);
    // Assign 'this' to a variable for use in the tooltip closure below.
    var thisBlock = this;
    this.setTooltip(function() {
      var mode = thisBlock.getFieldValue('OP');
      var TOOLTIPS = {
        'ADD': Blockly.Msg.MATH_ARITHMETIC_TOOLTIP_ADD,
        'MINUS': Blockly.Msg.MATH_ARITHMETIC_TOOLTIP_MINUS,
        'MULTIPLY': Blockly.Msg.MATH_ARITHMETIC_TOOLTIP_MULTIPLY,
        'DIVIDE': Blockly.Msg.MATH_ARITHMETIC_TOOLTIP_DIVIDE,
        'POWER': Blockly.Msg.MATH_ARITHMETIC_TOOLTIP_POWER
      };
      return TOOLTIPS[mode];
    });
  }
};

Webc['webc_math_arithmetic'] = function(block) {
    // Basic arithmetic operators, and power.
    var OPERATORS = {
            'ADD':      '+',
            'MINUS':    '-',
            'MULTIPLY': '*',
            'DIVIDE':   '/',
            'MODULO':   '%'
        },
        operator = OPERATORS[block.getFieldValue('OP')],
        argument0 = Webc.valueToCode(block, 'A'),
        argument1 = Webc.valueToCode(block, 'B'),
        instr;
    if (!argument0) {
        argument0 = { kind: 1, value: null }
    } else if (!argument0.kind) {
        argument0 = { kind: 1, value: argument0 };
    }
    if (!argument1) {
        argument1 = { kind: 1, value: null }
    } else if (!argument1.kind) {
        argument1 = { kind: 1, value: argument1 };
    }
    instr = { kind: 3, name: operator, arg1: argument0, arg2: argument1, id: block.id };
    return instr;
};

Blockly.Blocks['webc_math_change'] = {
  /**
   * Block for adding to a variable in place.
   * @this Blockly.Block
   */
  init: function() {
    this.setHelpUrl(Blockly.Msg.MATH_CHANGE_HELPURL);
    this.setColour(330);
    this.interpolateMsg(
        // TODO: Combine these messages instead of using concatenation.
        Blockly.Msg.MATH_CHANGE_TITLE_CHANGE + ' %1 ' +
        Blockly.Msg.MATH_CHANGE_INPUT_BY + ' %2',
        ['VAR', new Blockly.FieldVariable(Blockly.Msg.MATH_CHANGE_TITLE_ITEM)],
        ['DELTA', 'Number', Blockly.ALIGN_RIGHT],
        Blockly.ALIGN_RIGHT);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    // Assign 'this' to a variable for use in the tooltip closure below.
    var thisBlock = this;
    this.setTooltip(function() {
      return Blockly.Msg.MATH_CHANGE_TOOLTIP.replace('%1',
          thisBlock.getFieldValue('VAR'));
    });
  },
  /**
   * Return all variables referenced by this block.
   * @return {!Array.<string>} List of variable names.
   * @this Blockly.Block
   */
  getVars: function() {
    return [this.getFieldValue('VAR')];
  },
  /**
   * Notification that a variable is renaming.
   * If the name matches one of this block's variables, rename it.
   * @param {string} oldName Previous name of variable.
   * @param {string} newName Renamed variable.
   * @this Blockly.Block
   */
  renameVar: function(oldName, newName) {
    if (Blockly.Names.equals(oldName, this.getFieldValue('VAR'))) {
      this.setFieldValue(newName, 'VAR');
    }
  }
};

Webc['webc_math_change'] = function(block) {
    // Add to a variable in place.
    var delta = Webc.valueToCode(block, 'DELTA'),
        varName = block.getFieldValue('VAR'),
        instr = { kind: 12, name: varName, value: delta, id: block.id };

    if (!delta) {
        delta = { kind: 1, value: null };
    } else if (!delta.kind) {
        delta = { kind: 1, value: delta };
    }
    instr['value'] = delta;

    Webc.instructions.push(instr);
};

Blockly.Blocks['webc_math_random_int'] = {
  /**
   * Block for random integer between [X] and [Y].
   * @this Blockly.Block
   */
  init: function() {
    this.setHelpUrl(Blockly.Msg.MATH_RANDOM_INT_HELPURL);
    this.setColour(230);
    this.setOutput(true, 'Number');
    this.interpolateMsg('random %1 to %2',
                        ['FROM', 'Number', Blockly.ALIGN_RIGHT],
                        ['TO', 'Number', Blockly.ALIGN_RIGHT],
                        Blockly.ALIGN_RIGHT);
    this.setInputsInline(true);
    this.setTooltip(Blockly.Msg.MATH_RANDOM_INT_TOOLTIP);
  }
};

Webc['webc_math_random_int'] = function(block) {
    // Random integer between [X] and [Y].
    var argument0 = Webc.valueToCode(block, 'FROM'),
        argument1 = Webc.valueToCode(block, 'TO'),
        instr;

    if (!argument0) {
        argument0 = { kind: 1, value: null };
    } else if (!argument0.kind) {
        argument0 = { kind: 1, value: argument0 }
    }
    if (!argument1) {
        argument1 = { kind: 1, value: null }
    } else if (!argument1.kind) {
        argument1 = { kind: 1, value: argument1 }
    }
    instr = {
        kind: 3,
        name: 'rand',
        arg1: argument0,
        arg2: argument1,
        id: block.id
    }
    return instr;
};

Blockly.Blocks['webc_text'] = {
  /**
   * Block for text value.
   * @this Blockly.Block
   */
  init: function() {
    this.setHelpUrl(Blockly.Msg.TEXT_TEXT_HELPURL);
    this.setColour(160);
    this.appendDummyInput()
        .appendField(this.newQuote_(true))
        .appendField(new Blockly.FieldTextInput(''), 'TEXT')
        .appendField(this.newQuote_(false));
    this.setOutput(true, 'String');
    this.setTooltip(Blockly.Msg.TEXT_TEXT_TOOLTIP);
  },
  /**
   * Create an image of an open or closed quote.
   * @param {boolean} open True if open quote, false if closed.
   * @return {!Blockly.FieldImage} The field image of the quote.
   * @private
   */
  newQuote_: function(open) {
    if (open == Blockly.RTL) {
      var file = 'quote1.png';
    } else {
      var file = 'quote0.png';
    }
    return new Blockly.FieldImage(Blockly.pathToBlockly + 'media/' + file,
                                  12, 12, '"');
  }
};

// text

Webc['text'] = function(block) {
    return block.getFieldValue('TEXT');
};

/**
 * @fileoverview Variable blocks for Blockly.
 * @author fraser@google.com (Neil Fraser)
 */

Blockly.Blocks['webc_variables_get'] = {
  /**
   * Block for variable getter.
   * @this Blockly.Block
   */
  init: function() {
    this.setHelpUrl(Blockly.Msg.VARIABLES_GET_HELPURL);
    this.setColour(330);
    this.appendDummyInput()
        .appendField('')
        .appendField(new Blockly.FieldVariable(
            Blockly.Msg.VARIABLES_GET_ITEM), 'VAR')
        .appendField('');
    this.setOutput(true, 'Number');
    this.setTooltip(Blockly.Msg.VARIABLES_GET_TOOLTIP);
    this.contextMenuMsg_ = Blockly.Msg.VARIABLES_GET_CREATE_SET;
    this.contextMenuType_ = 'webc_variables_set';
  },
  /**
   * Return all variables referenced by this block.
   * @return {!Array.<string>} List of variable names.
   * @this Blockly.Block
   */
  getVars: function() {
    return [this.getFieldValue('VAR')];
  },
  /**
   * Notification that a variable is renaming.
   * If the name matches one of this block's variables, rename it.
   * @param {string} oldName Previous name of variable.
   * @param {string} newName Renamed variable.
   * @this Blockly.Block
   */
  renameVar: function(oldName, newName) {
    if (Blockly.Names.equals(oldName, this.getFieldValue('VAR'))) {
      this.setFieldValue(newName, 'VAR');
    }
  },
  /**
   * Add menu option to create getter/setter block for this setter/getter.
   * @param {!Array} options List of menu options to add to.
   * @this Blockly.Block
   */
  customContextMenu: function(options) {
    var option = {enabled: true};
    var name = this.getFieldValue('VAR');
    option.text = this.contextMenuMsg_.replace('%1', name);
    var xmlField = goog.dom.createDom('field', null, name);
    xmlField.setAttribute('name', 'VAR');
    var xmlBlock = goog.dom.createDom('block', null, xmlField);
    xmlBlock.setAttribute('type', this.contextMenuType_);
    option.callback = Blockly.ContextMenu.callbackFactory(this, xmlBlock);
    options.push(option);
  }
};

Webc['variables_get'] = function(block) {
    // Variable getter.
    var varName = block.getFieldValue('VAR');
    return { kind: 4, name: varName, id: block.id };
};

Webc['webc_variables_get'] = function(block) {
    // Variable getter.
    var varName = block.getFieldValue('VAR');
    //generalAlert('$$$ this is weird $$$$$');
    return { kind: 4, name: varName, id: block.id };
};

Blockly.Blocks['webc_variables_get_1'] = {
  /**
   * Block for variable getter.
   * @this Blockly.Block
   */
  init: function() {
    this.setHelpUrl(Blockly.Msg.VARIABLES_GET_HELPURL);
    this.setColour(330);
    this.appendDummyInput()
        .appendField(new Blockly.FieldTextInput(''), 'TEXT');
    this.setOutput(true, 'Number');
    this.setTooltip(Blockly.Msg.VARIABLES_GET_TOOLTIP);
    this.contextMenuMsg_ = Blockly.Msg.VARIABLES_GET_CREATE_SET;
    this.contextMenuType_ = 'webc_variables_set';
  },
  /**
   * Add menu option to create getter/setter block for this setter/getter.
   * @param {!Array} options List of menu options to add to.
   * @this Blockly.Block
   */
  customContextMenu: function(options) {
    var option = {enabled: true};
    var name = this.getFieldValue('VAR');
    option.text = this.contextMenuMsg_.replace('%1', name);
    var xmlField = goog.dom.createDom('field', null, name);
    xmlField.setAttribute('name', 'VAR');
    var xmlBlock = goog.dom.createDom('block', null, xmlField);
    xmlBlock.setAttribute('type', this.contextMenuType_);
    option.callback = Blockly.ContextMenu.callbackFactory(this, xmlBlock);
    options.push(option);
  }
};

Webc['webc_variables_get_1'] = function(block) {
    // Variable getter.
    var varName = block.getFieldValue('TEXT');
    return { kind: 7, name: varName, id: block.id };
};

Blockly.Blocks['webc_variables_set'] = {
  /**
   * Block for variable setter.
   * @this Blockly.Block
   */
  init: function() {
    this.setHelpUrl(Blockly.Msg.VARIABLES_SET_HELPURL);
    this.setColour(330);
    this.interpolateMsg(
        // TODO: Combine these messages instead of using concatenation.
        Blockly.Msg.VARIABLES_SET_TITLE + ' %1 ' +
        Blockly.Msg.VARIABLES_SET_TAIL + ' %2',
        ['VAR', new Blockly.FieldVariable(Blockly.Msg.VARIABLES_SET_ITEM)],
        ['VALUE', null, Blockly.ALIGN_RIGHT],
        Blockly.ALIGN_RIGHT);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip(Blockly.Msg.VARIABLES_SET_TOOLTIP);
    this.contextMenuMsg_ = Blockly.Msg.VARIABLES_SET_CREATE_GET;
    this.contextMenuType_ = 'webc_variables_get';
  },
  /**
   * Return all variables referenced by this block.
   * @return {!Array.<string>} List of variable names.
   * @this Blockly.Block
   */
  getVars: function() {
    return [this.getFieldValue('VAR')];
  },
  /**
   * Notification that a variable is renaming.
   * If the name matches one of this block's variables, rename it.
   * @param {string} oldName Previous name of variable.
   * @param {string} newName Renamed variable.
   * @this Blockly.Block
   */
  renameVar: function(oldName, newName) {
    if (Blockly.Names.equals(oldName, this.getFieldValue('VAR'))) {
      this.setFieldValue(newName, 'VAR');
    }
  },
  customContextMenu: Blockly.Blocks['webc_variables_get'].customContextMenu
};

Webc['variables_set'] = function(block) {
    // Variable setter.
    var val = Webc.valueToCode(block, 'VALUE'),
        varName = block.getFieldValue('VAR'),
        instr = { kind: 11, name: varName, value: val, id: block.id };
    // alert(' val = ' + val);
    if (!val) {
        instr['value'] = { kind: 1, value: null }
    } else if (!val.kind) {
        instr['value'] = { kind: 1, value: val }
    }
    Webc.instructions.push(instr);
    Webc.allVariables.push([0, varName]);
};

Blockly.Blocks['webc_if'] = {
  // Block for 'if' conditional if there is a path.
  init: function() {
    this.setColour(210);
    this.appendValueInput('BOOL')
        .setCheck('Boolean')
        .appendField('if');
    this.appendStatementInput('DO')
        .appendField('do');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
  }
};

Webc['webc_if'] = function(block) {
    // Generate JavaScript for 'if/else' conditional if there is a path.
    var argument, 
        instr1 = { kind: 31, arg1: null, value: 0, id: block.id },
        instr2 = { kind: 32 },
        pc;
    argument = Webc.valueToCode(block, 'BOOL');
    if (!argument) {
        argument = { kind: 1, value: null }
    } else if (!argument.kind) {
        argument = { kind: 1, value: argument }
    } 
    instr1['arg1'] = argument;
    Webc.instructions.push(instr1);
    pc = Webc.instructions.length;
    Webc.statementToCode(block, 'DO');
    instr1['value'] = Webc.instructions.length - pc;
    Webc.instructions.push(instr2);
};

Blockly.Blocks['webc_ifElse'] = {
  // Block for 'if/else' conditional if there is a path.
  init: function() {
    this.setColour(210);
    this.appendValueInput('BOOL')
        .setCheck('Boolean')
        .appendField('if');
    this.appendStatementInput('DO')
        .appendField('do');
    this.appendStatementInput('ELSE')
        .appendField('else');
    this.setTooltip(BlocklyApps.getMsg('webc_ifelseTooltip'));
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
  }
};

Webc['webc_ifElse'] = function(block) {
    // Generate JavaScript for 'if/else' conditional if there is a path.
    var argument, 
        instr1 = { kind: 33, arg1: null, value: 0, id: block.id },
        instr2 = { kind: 34, value: 0 },
        instr3 = { kind: 35 },
        pc1,
        pc2;
    argument = Webc.valueToCode(block, 'BOOL');
    if (!argument) {
        argument = { kind: 1, value: null }
    } else if (!argument.kind) {
        argument = { kind: 1, value: argument }
    } 
    instr1['arg1'] = argument;
    Webc.instructions.push(instr1);
    pc1 = Webc.instructions.length;
    Webc.statementToCode(block, 'DO');
    Webc.instructions.push(instr2);
    pc2 = Webc.instructions.length;
    instr1['value'] = pc2 - pc1;
    Webc.statementToCode(block, 'ELSE');
    instr2['value'] = Webc.instructions.length - pc2;
    Webc.instructions.push(instr3);
};

Blockly.Blocks['webc_logic_compare'] = {
  /**
   * Block for comparison operator.
   * @this Blockly.Block
   */
  init: function() {
    var OPERATORS = [
          ['==', 'EQ'],
          ['!=', 'NEQ'],
          ['<', 'LT'],
          ['<=', 'LTE'],
          ['>', 'GT'],
          ['>=', 'GTE']
        ];
    this.setHelpUrl(Blockly.Msg.LOGIC_COMPARE_HELPURL);
    this.setColour(210);
    this.setOutput(true, 'Boolean');
    this.appendValueInput('A');
    this.appendValueInput('B')
        .appendField(new Blockly.FieldDropdown(OPERATORS), 'OP');
    this.setInputsInline(true);
    // Assign 'this' to a variable for use in the tooltip closure below.
    var thisBlock = this;
    this.setTooltip(function() {
      var op = thisBlock.getFieldValue('OP');
      var TOOLTIPS = {
        'EQ': Blockly.Msg.LOGIC_COMPARE_TOOLTIP_EQ,
        'NEQ': Blockly.Msg.LOGIC_COMPARE_TOOLTIP_NEQ,
        'LT': Blockly.Msg.LOGIC_COMPARE_TOOLTIP_LT,
        'LTE': Blockly.Msg.LOGIC_COMPARE_TOOLTIP_LTE,
        'GT': Blockly.Msg.LOGIC_COMPARE_TOOLTIP_GT,
        'GTE': Blockly.Msg.LOGIC_COMPARE_TOOLTIP_GTE
      };
      return TOOLTIPS[op];
    });
  }
};

Webc['webc_logic_compare'] = function(block) {
    // Comparison operator.
    var OPERATORS = {
            'EQ': '==',
            'NEQ': '!=',
            'LT': '<',
            'LTE': '<=',
            'GT': '>',
            'GTE': '>='
        },
        operator = OPERATORS[block.getFieldValue('OP')],
        one = Webc.valueToCode(block, 'A'),
        two = Webc.valueToCode(block, 'B');
    if (!one) {
        one = { kind: 1, value: null }
    } else if (!one.kind) {
        one = { kind: 1, value: one }
    }
    if (!two) {
        two = { kind: 1, value: null }
    } else if (two.kind === undefined) {
        two = { kind: 1, value: two }
    }
    return { kind: 3, name: operator, arg1: one, arg2: two, id: block.id };
};

Blockly.Blocks['webc_logic_operation'] = {
  /**
   * Block for logical operations: 'and', 'or'.
   * @this Blockly.Block
   */
  init: function() {
    var OPERATORS =
        [[Blockly.Msg.LOGIC_OPERATION_AND, 'AND'],
         [Blockly.Msg.LOGIC_OPERATION_OR, 'OR']];
    this.setHelpUrl(Blockly.Msg.LOGIC_OPERATION_HELPURL);
    this.setColour(210);
    this.setOutput(true, 'Boolean');
    this.appendValueInput('A')
        .setCheck('Boolean');
    this.appendValueInput('B')
        .setCheck('Boolean')
        .appendField(new Blockly.FieldDropdown(OPERATORS), 'OP');
    this.setInputsInline(true);
    // Assign 'this' to a variable for use in the tooltip closure below.
    var thisBlock = this;
    this.setTooltip(function() {
      var op = thisBlock.getFieldValue('OP');
      var TOOLTIPS = {
        'AND': Blockly.Msg.LOGIC_OPERATION_TOOLTIP_AND,
        'OR': Blockly.Msg.LOGIC_OPERATION_TOOLTIP_OR
      };
      return TOOLTIPS[op];
    });
  }
};

Webc['webc_logic_operation'] = function(block) {
    // Operations 'and', 'or'.
    var operator = (block.getFieldValue('OP') == 'AND') ? '&&' : '||',
        one = Webc.valueToCode(block, 'A'),
        two = Webc.valueToCode(block, 'B');
    if (!one) {
        one = { kind: 1, value: null }
    } else if (!one.kind) {
        one = { kind: 1, value: one }
    }
    if (!two) {
        two = { kind: 1, value: null }
    } else if (!two.kind) {
        two = { kind: 1, value: two }
    }
    return { kind: 3, name: operator, arg1: one, arg2: two, id: block.id };
};

Blockly.Blocks['webc_logic_negate'] = {
  /**
   * Block for negation.
   * @this Blockly.Block
   */
  init: function() {
    this.setHelpUrl(Blockly.Msg.LOGIC_NEGATE_HELPURL);
    this.setColour(210);
    this.setOutput(true, 'Boolean');
    this.interpolateMsg(Blockly.Msg.LOGIC_NEGATE_TITLE,
                        ['BOOL', 'Boolean', Blockly.ALIGN_RIGHT],
                        Blockly.ALIGN_RIGHT);
    this.setTooltip(Blockly.Msg.LOGIC_NEGATE_TOOLTIP);
  }
};

Webc['webc_logic_negate'] = function(block) {
    // Negation.
    var cond = Webc.valueToCode(block, 'BOOL');
    if (!cond) {
        cond = { kind: 1, value: null }
    } else if (!cond.kind) {
        cond = { kind: 1, value: cond }
    }
    return { kind: 2, name: 'not', arg1: cond, id: block.id };
};

Blockly.Blocks['webc_logic_boolean'] = {
  /**
   * Block for boolean data type: true and false.
   * @this Blockly.Block
   */
  init: function() {
    var BOOLEANS =
        [[Blockly.Msg.LOGIC_BOOLEAN_TRUE, 'TRUE'],
         [Blockly.Msg.LOGIC_BOOLEAN_FALSE, 'FALSE']];
    this.setHelpUrl(Blockly.Msg.LOGIC_BOOLEAN_HELPURL);
    this.setColour(210);
    this.setOutput(true, 'Boolean');
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(BOOLEANS), 'BOOL');
    this.setTooltip(Blockly.Msg.LOGIC_BOOLEAN_TOOLTIP);
  }
};

Webc['webc_logic_boolean'] = function(block) {
    // Boolean values true and false.
    var instr = { kind: 1, value: block.getFieldValue('BOOL') === 'TRUE' };
    return instr;
};

Blockly.Blocks['webc_repeat'] = {
  /**
   * Block for repeat n times (external number).
   * @this Blockly.Block
   */
  init: function() {
    this.setHelpUrl(Blockly.Msg.CONTROLS_REPEAT_HELPURL);
    this.setColour(120);
    this.appendValueInput('TIMES')
        .setCheck('Number')
        .appendField('repeat');
    this.appendStatementInput('DO')
        .appendField('do');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
    this.setTooltip(Blockly.Msg.CONTROLS_REPEAT_TOOLTIP);
  }
};

Webc['webc_repeat'] = function(block) {
    // Repeat n times (external number).
    var val = Webc.valueToCode(block, 'TIMES'),
        instr1 = { kind: 23, value: val },
        instr2 = { kind: 24, arg1: 0, arg2: 0, value: 0, id: block.id },
        pc,
        instr3 = { kind: 25, value: 0 };
    if (!val) {
        val = { kind: 1, value: null };
    } else if (!val.kind) {
        val = { kind: 1, value: val };
    }
    instr1.value = val;
    Webc.instructions.push(instr1);
    Webc.instructions.push(instr2);
    pc = Webc.instructions.length;

    Webc.statementToCode(block, 'DO');

    Webc.instructions.push(instr3);
    instr2['value'] = Webc.instructions.length - pc;
    instr3['value'] = instr2.value;
};

Blockly.Blocks['webc_while'] = {
  /**
   * Block for 'do while/until' loop.
   * @this Blockly.Block
   */
  init: function() {
    this.setHelpUrl(Blockly.Msg.CONTROLS_WHILEUNTIL_HELPURL);
    this.setColour(120);
    this.appendValueInput('BOOL')
        .setCheck('Boolean')
        .appendField('while');
    this.appendStatementInput('DO')
        .appendField('do');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
    this.setTooltip(Blockly.Msg.CONTROLS_WHILEUNTIL_TOOLTIP_WHILE);
  }
};

Webc['webc_while'] = function(block) {
    // Do while/until loop.
    var cond, 
        instr1,
        pc,
        instr2 = { kind: 27, value: 0 };

    cond = Webc.valueToCode(block, 'BOOL'); 
    if (!cond) {
        cond = { kind: 1, value: null }
    } else if (!cond.kind) {
        cond = { kind: 1, value: cond }
    }
    instr1 = { kind: 26, arg1: cond, value: 0, id: block.id };
    Webc.instructions.push(instr1);
    pc = Webc.instructions.length;
  
    Webc.statementToCode(block, 'DO');

    Webc.instructions.push(instr2);
    instr1['value'] = Webc.instructions.length - pc;
    instr2['value'] = instr1.value;
};

Blockly.Blocks['webc_for'] = {
  /**
   * Block for 'for' loop.
   * @this Blockly.Block
   */
  init: function() {
    this.setHelpUrl(Blockly.Msg.CONTROLS_FOR_HELPURL);
    this.setColour(120);
    this.appendValueInput('FROM')
        .appendField('for')
        .setCheck('Number');
    this.appendValueInput('TO')
        .setCheck('Number')
        .appendField('\u2264')
        .appendField(new Blockly.FieldVariable(null), 'VAR')
        .appendField('<');
    this.appendStatementInput('DO')
        .appendField(Blockly.Msg.CONTROLS_FOR_INPUT_DO);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
    // Assign 'this' to a variable for use in the tooltip closure below.
    var thisBlock = this;
    this.setTooltip(function() {
      return Blockly.Msg.CONTROLS_FOR_TOOLTIP.replace('%1',
          thisBlock.getFieldValue('VAR'));
    });
  },
  /**
   * Return all variables referenced by this block.
   * @return {!Array.<string>} List of variable names.
   * @this Blockly.Block
   */
  getVars: function() {
    return [this.getFieldValue('VAR')];
  },
  /**
   * Notification that a variable is renaming.
   * If the name matches one of this block's variables, rename it.
   * @param {string} oldName Previous name of variable.
   * @param {string} newName Renamed variable.
   * @this Blockly.Block
   */
  renameVar: function(oldName, newName) {
    if (Blockly.Names.equals(oldName, this.getFieldValue('VAR'))) {
      this.setFieldValue(newName, 'VAR');
    }
  },
  /**
   * Add menu option to create getter block for loop variable.
   * @param {!Array} options List of menu options to add to.
   * @this Blockly.Block
   */
  customContextMenu: function(options) {
    if (!this.isCollapsed()) {
      var option = {enabled: true};
      var name = this.getFieldValue('VAR');
      option.text = Blockly.Msg.VARIABLES_SET_CREATE_GET.replace('%1', name);
      var xmlField = goog.dom.createDom('field', null, name);
      xmlField.setAttribute('name', 'VAR');
      var xmlBlock = goog.dom.createDom('block', null, xmlField);
      xmlBlock.setAttribute('type', 'variables_get');
      option.callback = Blockly.ContextMenu.callbackFactory(this, xmlBlock);
      options.push(option);
    }
  }
};

Webc['webc_for'] = function(block) {
    // For loop.
    var var_name = block.getFieldValue('VAR'),
        limit = Webc.valueToCode(block, 'TO'),
        instr1 = { kind: 28, name: var_name },
        instr2 = { kind: 29, name: var_name, arg1: limit, value: 0, id: block.id },
        pc,
        instr3 = { kind: 30, name: var_name, value: 0 };

    Webc.instructions.push(instr1);
    if (!limit) {
        instr2['arg1'] = { kind: 1, value: null }
    } else if (!limit.kind) {
        instr2['arg1'] = {kind: 1, value: limit};
    }
    Webc.instructions.push(instr2);
    pc = Webc.instructions.length;
  
    Webc.statementToCode(block, 'DO');

    Webc.instructions.push(instr3);
    instr2['value'] = Webc.instructions.length - pc;
    instr3['value'] = instr2.value;
    Webc.allVariables.push([0, var_name]);
};

Blockly.Blocks['webc_clear_screen'] = {
  init: function() {
    this.setHelpUrl('http://www.example.com/');
    this.setColour(160);
    this.appendDummyInput()
        .appendField("clear screen");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('');
  }
};

Webc['webc_clear_screen'] = function(block) {
    // clear screen
    var instr = { kind: 17, id: block.id };
    Webc.instructions.push(instr);
};

Blockly.Blocks['click_console_button'] = {
  init: function() {
    this.setHelpUrl('http://www.example.com/');
    this.setColour(330);
    this.appendDummyInput()
        .appendField("click console button");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('');
  }
};

Webc['click_console_button'] = function(block) {
    // clear screen
    var instr = { kind: 42, id: block.id };
    Webc.instructions.push(instr);
};

Blockly.Blocks['webc_start'] = {
  init: function() {
    this.setHelpUrl('http://www.example.com/');
    this.setColour(0);
    this.appendDummyInput()
        .appendField("start");
    this.setNextStatement(true);
    this.setTooltip('');
  }
};

Webc['webc_start'] = function(block) {
    // nop
    var instr = { kind: 36, id: block.id };
    Webc.instructions.push(instr);
};

Blockly.Blocks['webc_print_newline'] = {
  init: function() {
    this.setHelpUrl('http://www.example.com/');
    this.setColour(160);
    this.appendDummyInput()
        .appendField("printline");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('');
  }
};

Webc['webc_print_newline'] = function(block) {
    // print newline
    var instr = { kind: 18, id: block.id };
    Webc.instructions.push(instr);
};

Blockly.Blocks['webc_print4'] = {
  // Block for moving forward or backwards.
  init: function() {
    var FORMATS =
        [['4', '4'],
         ['5', '5'],
         ['8', '8'],
         ['10', '10']];
    this.setColour(160);
    this.appendValueInput('VALUE')
        .setCheck('Number')
        .appendField('print')
        .appendField(new Blockly.FieldDropdown(FORMATS), 'FMT');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
    this.setTooltip(BlocklyApps.getMsg('webc_moveTooltip'));
  }
};

Webc['webc_print4'] = function(block) {
    // print formatted number.
    var fmt   = block.getFieldValue('FMT'),
        val   = Webc.valueToCode(block, 'VALUE'),
        instr = { kind: 21, arg1: {kind: 1, value: fmt}, value: val, id: block.id };
    if (!val) {
        instr.value = { kind: 1, value: null }
    } else if (!val.kind) {
        instr.value = { kind: 1, value: val };
    }
    Webc.instructions.push(instr);
};

Blockly.Blocks['webc_print_num'] = {
  // Block for setting the width.
  init: function() {
    this.setColour(160);
    this.appendValueInput('NUM')
        .setCheck('Number')
        .appendField('print');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
    this.setTooltip(BlocklyApps.getMsg('webc_widthTooltip'));
  }
};

Webc['webc_print_num'] = function(block) {
    // print number.
    var val   = Webc.valueToCode(block, 'NUM'),
        instr = { kind: 22, value: val, id: block.id };
    if (!val) {
        instr.value = { kind: 1, value: null }
    } else if (!val.kind) {
        instr.value = { kind: 1, value: val }
    }
    Webc.instructions.push(instr);
};

Blockly.Blocks['webc_print_str'] = {
  // Block for printing text.
  init: function() {
    this.setHelpUrl(BlocklyApps.getMsg('webc_printHelpUrl'));
    this.setColour(160);
    this.appendValueInput('TEXT')
        .appendField('print')
        .setCheck('String');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
    this.setTooltip(BlocklyApps.getMsg('webc_printTooltip'));
  }
};

Webc['webc_print_str'] = function(block) {
    // printing text.
    var value_text = Webc.valueToCode(block, 'TEXT'),
        instr = { kind: 19, name: value_text, id: block.id };
    Webc.instructions.push(instr);
};

Blockly.Blocks['webc_print_str_times'] = {
  // Block for printing text.
  init: function() {
    this.setHelpUrl(BlocklyApps.getMsg('webc_printHelpUrl'));
    this.setColour(160);
    this.appendValueInput('TEXT')
        .appendField('print')
        .setCheck('String');
    this.appendValueInput('NUM')
        .setCheck('Number');
    this.appendDummyInput()
        .appendField('times');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
    this.setTooltip(BlocklyApps.getMsg('webc_printTooltip'));
  }
};

Webc['webc_print_str_times'] = function(block) {
    // printing text times.
    var value_text = Webc.valueToCode(block, 'TEXT'),
        val =  Webc.valueToCode(block, 'NUM'),
        instr;
    if (!val) {
        val = { kind: 1, value: null };
    } else if (!val.kind) {
        val = { kind: 1, value: val };
    }
    instr = { kind: 20, name: value_text, value: val, id: block.id };
    Webc.instructions.push(instr);
};

Blockly.Blocks['webc_get'] = {
  // Block for setting the width.
  init: function() {
    this.setColour(160);
    this.appendValueInput('NUM')
        .setCheck('Number')
        .appendField('ignore');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
    this.setTooltip(BlocklyApps.getMsg('webc_widthTooltip'));
  }
};

Webc['webc_get'] = function(block) {
    // print number.
    var val   = Webc.valueToCode(block, 'NUM'),
        instr = { kind: 36, name: 'ignore', value: val, id: block.id };
    if (!val) {
        instr.value = { kind: 1, value: null }
    } else if (!val.kind) {
        instr.value = { kind: 1, value: val }
    }
    Webc.instructions.push(instr);
};

Blockly.Blocks['webc_array_one_get'] = {
  /**
   * Block for variable getter.
   * @this Blockly.Block
   */
  init: function() {
    this.setHelpUrl(Blockly.Msg.VARIABLES_GET_HELPURL);
    this.setColour(330);
    this.appendValueInput('INDEX')
        .setCheck('Number')
        .appendField(new Blockly.FieldArray('arr1'), 'ARR');
    this.setOutput(true);
    this.setInputsInline(true);
    this.setTooltip(Blockly.Msg.VARIABLES_GET_TOOLTIP);
    this.contextMenuMsg_ = Blockly.Msg.VARIABLES_GET_CREATE_SET;
    this.contextMenuType_ = 'webc_array_one_set';
  },
  /**
   * Return all variables referenced by this block.
   * @return {!Array.<string>} List of variable names.
   * @this Blockly.Block
   */
  getArrs: function() {
    return [this.getFieldValue('ARR')];
  },
  /**
   * Notification that a variable is renaming.
   * If the name matches one of this block's variables, rename it.
   * @param {string} oldName Previous name of variable.
   * @param {string} newName Renamed variable.
   * @this Blockly.Block
   */
  renameArr: function(oldName, newName) {
    if (Blockly.Names.equals(oldName, this.getFieldValue('ARR'))) {
      this.setFieldValue(newName, 'ARR');
    }
  },
  /**
   * Add menu option to create getter/setter block for this setter/getter.
   * @param {!Array} options List of menu options to add to.
   * @this Blockly.Block
   */
  customContextMenu: function(options) {
    var option = {enabled: true};
    var name = this.getFieldValue('ARR');
    option.text = this.contextMenuMsg_.replace('%1', name);
    var xmlField = goog.dom.createDom('field', null, name);
    xmlField.setAttribute('name', 'ARR');
    var xmlBlock = goog.dom.createDom('block', null, xmlField);
    xmlBlock.setAttribute('type', this.contextMenuType_);
    option.callback = Blockly.ContextMenu.callbackFactory(this, xmlBlock);
    options.push(option);
  },
  dim: 1
};

Webc['webc_array_one_get'] = function(block) {
    // Variable getter.
    var arrName = block.getFieldValue('ARR'),
        index,
        instr;
    index = Webc.valueToCode(block, 'INDEX');
    if (!index) {
        index = { kind: 1, value: null }
    } else if (!index.kind) {
        index = { kind: 1, value: index }
    }
    instr = { kind: 5, name: arrName, arg1: index, id: block.id };
    return instr;
};

Blockly.Blocks['webc_array_one_set'] = {
  /**
   * Block for variable setter.
   * @this Blockly.Block
   */
  init: function() {

    this.setHelpUrl(Blockly.Msg.VARIABLES_SET_HELPURL);
    this.setColour(330);
    this.appendDummyInput()
        .appendField('set');
    this.appendValueInput('INDEX')
        .setCheck('Number')
        .appendField(new Blockly.FieldArray('arr1'), 'ARR');
    this.appendValueInput('VALUE')
        .setCheck('Number')
        .appendField('to');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
    this.setTooltip(Blockly.Msg.VARIABLES_SET_TOOLTIP);
    this.contextMenuMsg_ = Blockly.Msg.VARIABLES_SET_CREATE_GET;
    this.contextMenuType_ = 'webc_array_one_get';
  },
  /**
   * Return all variables referenced by this block.
   * @return {!Array.<string>} List of variable names.
   * @this Blockly.Block
   */
  getArrs: function() {
    return [this.getFieldValue('ARR')];
  },
  /**
   * Notification that a variable is renaming.
   * If the name matches one of this block's variables, rename it.
   * @param {string} oldName Previous name of variable.
   * @param {string} newName Renamed variable.
   * @this Blockly.Block
   */
  renameArr: function(oldName, newName) {
    if (Blockly.Names.equals(oldName, this.getFieldValue('ARR'))) {
      this.setFieldValue(newName, 'ARR');
    }
  },
  customContextMenu: Blockly.Blocks['webc_array_one_get'].customContextMenu,
  dim: 1
};

Webc['webc_array_one_set'] = function(block) {
    // Variable setter.
    var arrName = block.getFieldValue('ARR'),
        index,
        val,
        instr;
    index = Webc.valueToCode(block, 'INDEX');
    if (!index) {
        index = { kind: 1, value: null }
    } else if (!index.kind) {
        index = { kind: 1, value: index }
    }
    val   = Webc.valueToCode(block, 'VALUE');
    if (!val) {
        val = { kind: 1, value: null }
    } else if (!val.kind) {
        val = { kind: 1, value: val }
    }
    instr = { kind: 13, name: arrName, arg1: index, value: val, id: block.id };
    Webc.instructions.push(instr);
};

Blockly.Blocks['webc_array_one_resize'] = {
  /**
   * Block for variable setter.
   * @this Blockly.Block
   */
  init: function() {

    this.setHelpUrl(Blockly.Msg.VARIABLES_SET_HELPURL);
    this.setColour(330);
    this.appendDummyInput()
        .appendField('init');
    this.appendValueInput('INDEX')
        .setCheck('Number')
        .appendField(new Blockly.FieldArray('arr1'), 'ARR');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
    this.setTooltip(Blockly.Msg.VARIABLES_SET_TOOLTIP);
    this.contextMenuMsg_ = Blockly.Msg.VARIABLES_SET_CREATE_GET;
    this.contextMenuType_ = 'webc_array_one_get';
  },
  /**
   * Return all variables referenced by this block.
   * @return {!Array.<string>} List of variable names.
   * @this Blockly.Block
   */
  getArrs: function() {
    return [this.getFieldValue('ARR')];
  },
  /**
   * Notification that a variable is renaming.
   * If the name matches one of this block's variables, rename it.
   * @param {string} oldName Previous name of variable.
   * @param {string} newName Renamed variable.
   * @this Blockly.Block
   */
  renameArr: function(oldName, newName) {
    if (Blockly.Names.equals(oldName, this.getFieldValue('ARR'))) {
      this.setFieldValue(newName, 'ARR');
    }
  },
  customContextMenu: Blockly.Blocks['webc_array_one_get'].customContextMenu,
  dim: 1
};

Webc['webc_array_one_resize'] = function(block) {
    // Variable setter.
    var arrName = block.getFieldValue('ARR'),
        index,
        instr;
    index = Webc.valueToCode(block, 'INDEX');
    if (!index) {
        index = { kind: 1, value: null }
    } else if (!index.kind) {
        index = { kind: 1, value: index }
    }
    instr = { kind: 15, name: arrName, arg1: index, id: block.id };
    Webc.instructions.push(instr);
    Webc.oneList.push(arrName);
    Webc.allVariables.push([1, arrName]);
};

Blockly.Blocks['webc_array_one_resize_'] = {
  /**
   * Block for variable setter.
   * @this Blockly.Block
   */
  init: function() {

    this.setHelpUrl(Blockly.Msg.VARIABLES_SET_HELPURL);
    this.setColour(330);
    this.appendDummyInput()
        .appendField('init');
    this.appendValueInput('INDEX')
        .setCheck('Number')
        .appendField(new Blockly.FieldArray('arr1'), 'ARR');
    this.appendDummyInput()
        .appendField('with')
        .appendField(new Blockly.FieldTextInput(''), 'TEXT');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
    this.setTooltip(Blockly.Msg.VARIABLES_SET_TOOLTIP);
    this.contextMenuMsg_ = Blockly.Msg.VARIABLES_SET_CREATE_GET;
    this.contextMenuType_ = 'webc_array_one_get';
  },
  /**
   * Return all variables referenced by this block.
   * @return {!Array.<string>} List of variable names.
   * @this Blockly.Block
   */
  getArrs: function() {
    return [this.getFieldValue('ARR')];
  },
  /**
   * Notification that a variable is renaming.
   * If the name matches one of this block's variables, rename it.
   * @param {string} oldName Previous name of variable.
   * @param {string} newName Renamed variable.
   * @this Blockly.Block
   */
  renameArr: function(oldName, newName) {
    if (Blockly.Names.equals(oldName, this.getFieldValue('ARR'))) {
      this.setFieldValue(newName, 'ARR');
    }
  },
  customContextMenu: Blockly.Blocks['webc_array_one_get'].customContextMenu,
  dim: 1
};

Webc['webc_array_one_resize_'] = function(block) {
    // Variable setter.
    var arrName = block.getFieldValue('ARR'),
        index,
        instr, 
        text,
        options;
    index = Webc.valueToCode(block, 'INDEX');
    if (!index) {
        index = { kind: 1, value: null }
    } else if (!index.kind) {
        index = { kind: 1, value: index }
    }
    text = block.getFieldValue('TEXT');
    text = text.replace(/,/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    options = text.split(' ');

    instr = { kind: 15, name: arrName, arg1: index, options: options, id: block.id };
    Webc.instructions.push(instr);
    Webc.oneList.push(arrName);
    Webc.allVariables.push([1, arrName]);
};

Blockly.Blocks['webc_array_two_get'] = {
  /**
   * Block for variable getter.
   * @this Blockly.Block
   */
  init: function() {
    this.setHelpUrl(Blockly.Msg.VARIABLES_GET_HELPURL);
    this.setColour(330);
    this.appendValueInput('INDEX1')
        .setCheck('Number')
        .appendField(new Blockly.FieldArray('arr2'), 'ARR');
    this.appendValueInput('INDEX2')
        .setCheck('Number');
    this.setOutput(true);
    this.setInputsInline(true);
    this.setTooltip(Blockly.Msg.VARIABLES_GET_TOOLTIP);
    this.contextMenuMsg_ = Blockly.Msg.VARIABLES_GET_CREATE_SET;
    this.contextMenuType_ = 'webc_array_one_set';
  },
  /**
   * Return all variables referenced by this block.
   * @return {!Array.<string>} List of variable names.
   * @this Blockly.Block
   */
  getArrs: function() {
    return [this.getFieldValue('ARR')];
  },
  /**
   * Notification that a variable is renaming.
   * If the name matches one of this block's variables, rename it.
   * @param {string} oldName Previous name of variable.
   * @param {string} newName Renamed variable.
   * @this Blockly.Block
   */
  renameArr: function(oldName, newName) {
    if (Blockly.Names.equals(oldName, this.getFieldValue('ARR'))) {
      this.setFieldValue(newName, 'ARR');
    }
  },
  /**
   * Add menu option to create getter/setter block for this setter/getter.
   * @param {!Array} options List of menu options to add to.
   * @this Blockly.Block
   */
    customContextMenu: Blockly.Blocks['webc_array_one_get'].customContextMenu,
    dim: 2
};

Webc['webc_array_two_get'] = function(block) {
    // Variable getter.
    var arrName = block.getFieldValue('ARR'),
        index1,
        index2,
        instr;
    index1 = Webc.valueToCode(block, 'INDEX1');
    if (!index1) {
        index1 = { kind: 1, value: null }
    } else if (!index1.kind) {
        index1 = { kind: 1, value: index1 }
    }
    index2 = Webc.valueToCode(block, 'INDEX2');
    if (!index2) {
        index2 = { kind: 1, value: null }
    } else if (!index2.kind) {
        index2 = { kind: 1, value: index2 }
    }
    instr = { kind: 6, name: arrName, arg1: index1, arg2: index2, id: block.id };
    return instr;
};

Blockly.Blocks['webc_array_two_set'] = {
  /**
   * Block for variable setter.
   * @this Blockly.Block
   */
  init: function() {

    this.setHelpUrl(Blockly.Msg.VARIABLES_SET_HELPURL);
    this.setColour(330);
    this.appendDummyInput()
        .appendField('set');
    this.appendValueInput('INDEX1')
        .setCheck('Number')
        .appendField(new Blockly.FieldArray('arr2'), 'ARR');
    this.appendValueInput('INDEX2')
        .setCheck('Number');
    this.appendValueInput('VALUE')
        .setCheck('Number')
        .appendField('to');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
    this.setTooltip(Blockly.Msg.VARIABLES_SET_TOOLTIP);
    this.contextMenuMsg_ = Blockly.Msg.VARIABLES_SET_CREATE_GET;
    this.contextMenuType_ = 'webc_array_one_get';
  },
  /**
   * Return all variables referenced by this block.
   * @return {!Array.<string>} List of variable names.
   * @this Blockly.Block
   */
  getArrs: function() {
    return [this.getFieldValue('ARR')];
  },
  /**
   * Notification that a variable is renaming.
   * If the name matches one of this block's variables, rename it.
   * @param {string} oldName Previous name of variable.
   * @param {string} newName Renamed variable.
   * @this Blockly.Block
   */
  renameArr: function(oldName, newName) {
    if (Blockly.Names.equals(oldName, this.getFieldValue('ARR'))) {
      this.setFieldValue(newName, 'ARR');
    }
  },
  customContextMenu: Blockly.Blocks['webc_array_one_get'].customContextMenu,
  dim: 2
};

Webc['webc_array_two_set'] = function(block) {
    // Variable setter.
    var arrName = block.getFieldValue('ARR'),
        index1,
        index2,
        val,
        instr;
    index1 = Webc.valueToCode(block, 'INDEX1');
    if (!index1) {
        index1 = { kind: 1, value: null }
    } else if (!index1.kind) {
        index1 = { kind: 1, value: index1 }
    }
    index2 = Webc.valueToCode(block, 'INDEX2');
    if (!index2) {
        index2 = { kind: 1, value: null }
    } else if (!index2.kind) {
        index2 = { kind: 1, value: index2 }
    }
    val = Webc.valueToCode(block, 'VALUE');
    if (!val) {
        val = { kind: 1, value: null }
    } else if (!val.kind) {
        val = { kind: 1, value: val }
    }
    instr = { kind: 14, name: arrName, arg1: index1, arg2: index2, value: val, id: block.id };
    Webc.instructions.push(instr);
};

Blockly.Blocks['webc_array_two_resize'] = {
  /**
   * Block for variable setter.
   * @this Blockly.Block
   */
  init: function() {

    this.setHelpUrl(Blockly.Msg.VARIABLES_SET_HELPURL);
    this.setColour(330);
    this.appendDummyInput()
        .appendField('init');
    this.appendValueInput('INDEX1')
        .setCheck('Number')
        .appendField(new Blockly.FieldArray('arr2'), 'ARR');
    this.appendValueInput('INDEX2')
        .setCheck('Number');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
    this.setTooltip(Blockly.Msg.VARIABLES_SET_TOOLTIP);
    this.contextMenuMsg_ = Blockly.Msg.VARIABLES_SET_CREATE_GET;
    this.contextMenuType_ = 'webc_array_one_get';
  },
  /**
   * Return all variables referenced by this block.
   * @return {!Array.<string>} List of variable names.
   * @this Blockly.Block
   */
  getArrs: function() {
    return [this.getFieldValue('ARR')];
  },
  /**
   * Notification that a variable is renaming.
   * If the name matches one of this block's variables, rename it.
   * @param {string} oldName Previous name of variable.
   * @param {string} newName Renamed variable.
   * @this Blockly.Block
   */
  renameArr: function(oldName, newName) {
    if (Blockly.Names.equals(oldName, this.getFieldValue('ARR'))) {
      this.setFieldValue(newName, 'ARR');
    }
  },
  customContextMenu: Blockly.Blocks['webc_array_one_get'].customContextMenu,
  dim: 2
};

Webc['webc_array_two_resize'] = function(block) {
    // Variable setter.
    var arrName = block.getFieldValue('ARR'),
        index1,
        index2,
        instr;
    index1 = Webc.valueToCode(block, 'INDEX1');
    if (!index1) {
        index1 = { kind: 1, value: null }
    } else if (!index1.kind) {
        index1 = { kind: 1, value: index1 }
    }
    index2 = Webc.valueToCode(block, 'INDEX2');
    if (!index2) {
        index2 = { kind: 1, value: null }
    } else if (!index2.kind) {
        index2 = { kind: 1, value: index2 }
    }
    instr = { kind: 16, name: arrName, arg1: index1, arg2: index2, id: block.id };
    Webc.instructions.push(instr);
    Webc.twoList.push(arrName);
    Webc.allVariables.push([2, arrName]);
};

Webc['procedures_defreturn'] = function(block) {

    // Generate JavaScript for 'if/else' conditional if there is a path.
    var funcName = block.getFieldValue('NAME'),
        x,
        returnValue,
        instr1 = { kind: 39, args: [] },
        instr2 = { kind: 40, value: null };
    for (x = 0; x < block.arguments_.length; x += 1) {
        instr1.args[x] = block.arguments_[x];
    }    
    Webc.instructions.push(instr1);
    Webc.statementToCode(block, 'STACK');
    returnValue = Webc.valueToCode(block, 'RETURN');
    // alert('>>> ' + JSON.stringify(returnValue));   
    instr2['value'] = returnValue;
    Webc.instructions.push(instr2);
};

// Defining a procedure without a return value uses the same generator as
// a procedure with a return value.
Webc['procedures_defnoreturn'] = function(block) {

    // Generate JavaScript for 'if/else' conditional if there is a path.
    var funcName = block.getFieldValue('NAME'),
        x,
        instr1 = { kind: 39, args: [] },
        instr2 = { kind: 40, value: null };
    for (x = 0; x < block.arguments_.length; x += 1) {
        instr1.args[x] = block.arguments_[x];
    }    
    Webc.instructions.push(instr1);
    Webc.statementToCode(block, 'STACK');
    Webc.instructions.push(instr2);
};

Webc['procedures_callreturn'] = function(block) {
    // Call a procedure with a return value.
    var funcName = block.getFieldValue('NAME'),
        x,
        val,
        instr1 = {
            kind: 38,
            name: funcName,
            args: [],
            id: block.id
        },
        instr2;
    for (x = 0; x < block.arguments_.length; x++) {
        val = Webc.valueToCode(block, 'ARG' + x);
        if (!val.kind) {
            val = { kind: 1, value: val }
        }
        instr1.args[x] = val;    
    }
    Webc.instructions.push(instr1);
    // alert('*  *  $ ' + JSON.stringify(instr1.args));   

    return { kind: 8, id: block.id };
};

Webc['procedures_callnoreturn'] = function(block) {
    // Call a procedure with no return value.
    var funcName = block.getFieldValue('NAME'),
        x,
        val,
        instr = {
            kind: 38,
            name: funcName,
            args: [],
            id: block.id
        };
    for (x = 0; x < block.arguments_.length; x++) {
        val = Webc.valueToCode(block, 'ARG' + x);
        if (!val.kind) {
            val = { kind: 1, value: val }
        }
        instr.args[x] = val;    
    }
    Webc.instructions.push(instr);
};

Webc['procedures_ifreturn'] = function(block) {
    // Conditionally return value from a procedure.
    var cond,
        val,
        instr;
    cond = Webc.valueToCode(block, 'CONDITION');
    if (!cond) {
        cond = { kind: 1, value: false }
    } else if (!cond.kind) {
        cond = { kind: 1, value: cond }
    } 
    if (block.hasReturnValue_) {
        val = Webc.valueToCode(block, 'VALUE'); 
        if (!val.kind) {
            val = { kind: 1, value: val }
        }
        instr = {
            kind: 40,
            arg1: cond,
            value: val,
            id: block.id
        }
    } else {
        instr = {
            kind: 40,
            arg1: cond,
            value: null,
            id: block.id
        }

    }
    Webc.instructions.push(instr);
};

// block for problem set 1.

Blockly.Blocks['problem_set_1'] = {
  // Block for moving forward or backwards.
  init: function() {
    var PROBLEMLIST = // Common font names (intentionally not localized)
        [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'],
         ['6', '6'], ['7', '7'], ['8', '8'], ['9', '9'], ['10', '10']];
    this.setColour(225);
    this.appendDummyInput()
        .appendField('problem set 1');
    this.appendValueInput('VALUE')
        .setCheck('Number')
        .appendField(new Blockly.FieldDropdown(PROBLEMLIST), 'ORDER');
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip(BlocklyApps.getMsg('Turtle_moveTooltip'));
  }
};

Webc['problem_set_1'] = function(block) {
    var index = block.getFieldValue('ORDER'),
        instr = { kind: 38, name: '_p1_' + index, args: [], id: block.id };
    // generalAlert(Webc.p1Expand(index));
    instr.args.push(Webc.valueToCode(block, 'VALUE'));
    Webc.instructions.push(instr);
};

// block for problem set 1.

Blockly.Blocks['problem_set_2'] = {
  // Block for moving forward or backwards.
  init: function() {
    var PROBLEMLIST = // Common font names (intentionally not localized)
        [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'],
         ['6', '6'], ['7', '7'], ['8', '8'], ['9', '9'], ['10', '10']];
    this.setColour(225);
    this.appendDummyInput()
        .appendField('problem set 2');
    this.appendValueInput('VALUE')
        .setCheck('Number')
        .appendField(new Blockly.FieldDropdown(PROBLEMLIST), 'ORDER');
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip(BlocklyApps.getMsg('Turtle_moveTooltip'));
  }
};

Webc['problem_set_2'] = function(block) {
    var index = block.getFieldValue('ORDER'),
        instr = { kind: 38, name: '_p2_' + index, args: [], id: block.id };
    //generalAlert(Webc.p1Expand(index));
    instr.args.push(Webc.valueToCode(block, 'VALUE'));
    Webc.instructions.push(instr);
};


// block for problem set 1.

Blockly.Blocks['problem_set_3'] = {
  // Block for moving forward or backwards.
  init: function() {
    var PROBLEMLIST = // Common font names (intentionally not localized)
        [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'],
         ['6', '6'], ['7', '7'], ['8', '8'], ['9', '9'], ['10', '10'],
         ['11', '11'], ['12', '12'], ['13', '13']];
    this.setColour(225);
    this.appendDummyInput()
        .appendField('problem set 3');
    this.appendValueInput('VALUE')
        .setCheck('Number')
        .appendField(new Blockly.FieldDropdown(PROBLEMLIST), 'ORDER');
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip(BlocklyApps.getMsg('Turtle_moveTooltip'));
  }
};

Webc['problem_set_3'] = function(block) {
    var index = block.getFieldValue('ORDER'),
        instr = { kind: 38, name: '_p3_' + index, args: [], id: block.id };
    //generalAlert(Webc.p34Expand(index));
    instr.args.push(Webc.valueToCode(block, 'VALUE'));
    Webc.instructions.push(instr);
};


// block for problem set 1.

Blockly.Blocks['problem_set_4'] = {
  // Block for moving forward or backwards.
  init: function() {
    var PROBLEMLIST = // Common font names (intentionally not localized)
        [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']];
    this.setColour(225);
    this.appendDummyInput()
        .appendField('problem set 4');
    this.appendValueInput('VALUE')
        .setCheck('Number')
        .appendField(new Blockly.FieldDropdown(PROBLEMLIST), 'ORDER');
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip(BlocklyApps.getMsg('Turtle_moveTooltip'));
  }
};

Webc['problem_set_4'] = function(block) {
    var index = block.getFieldValue('ORDER'),
        instr = { kind: 38, name: '_p4_' + index, args: [], id: block.id };
    // generalAlert(Webc.p44Expand(index+13));
    instr.args.push(Webc.valueToCode(block, 'VALUE'));    
    Webc.instructions.push(instr);
};
