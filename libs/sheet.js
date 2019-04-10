'use strict'

class Sheet {
  constructor(container, json) {
    this._characterName = '';
    this._rollGroups = Array();
    Object.defineProperty(this, '_container', { value: jQuery(container), writable: true });
    if (typeof (json) === 'undefined') {
      let newGroup = this.addGroup();
      newGroup.addRoll('', '');
      this.render();
      this.edit();
    } else {
      this.load(json);
      this.render();
    }
  }
  addGroup(name) {
    let newGroup = new RollGroup(name);
    this._rollGroups.push(newGroup);
    return newGroup;
  }
  getJSON() {
    let sheet = {};
    sheet._characterName = this._characterName;
    sheet._rollGroups = this._rollGroups;
    return JSON.stringify(sheet);
  }
  set name(name) {
    this._characterName = name;
  }
  get name() {
    return this._characterName;
  }
  render() {
    this._container.html();
    this._rollGroups.forEach((group) => {
      this._container.append(group.render());
    });
    let addButtonGroup = jQuery('<input type="button" />').addClass('squareButton').addClass('dashed').addClass('editOnly').val('Add Group');
    addButtonGroup.click((e) => {
      let newGroup = this.addGroup("");
      newGroup.addRoll("","");
      jQuery(e.target).before(newGroup.render());
    });

    this._container.append(addButtonGroup);
  }
  edit() {
    this._container.addClass('editing');
  }
  save() {
    this.deleteEmptyGroups()
    this._container.removeClass('editing');
  }
  download() {
    let fileName = (this._characterName.trim() === '') ? 'sheet.txt' : this._characterName+'.txt';
    fileName = fileName.replace(/ /g,"_");
    let fileContents = this.getJSON();
    saveTextAs(fileContents, fileName);
  }
  deleteEmptyGroups() {
    for(let i=this._rollGroups.length-1; i>= 0; i--) {
      let group = this._rollGroups[i];
      group.deleteEmptyRolls();
      if(group.isEmpty()) {
        group.remove();
        this._rollGroups.splice(i, 1);
      }
    }
  }
  load(json) {
    let sheet = JSON.parse(json);
    this._characterName = sheet._characterName;
    sheet._rollGroups.forEach((group) => {
      let newGroup = this.addGroup(group._name);
      group._rolls.forEach((roll) => {
        newGroup.addRoll(roll._name, roll._set);
      });
    });
  }
}

class RollGroup {
  constructor(name) {
    this._name = name;
    this._rolls = Array();
    Object.defineProperty(this, '_view', { value: null, writable: true });
  }
  addRoll(name, set) {
    let newRoll = new Roll(name, set);
    this._rolls.push(newRoll);
    return newRoll;
  }
  render(parent) {
    let container = jQuery('<ul />');
    let titleContainer = jQuery('<li />').addClass('title');
    let title = jQuery('<input type="text" placeholder="Group name" />').val(this._name);
    title.change((e) => {
      this._name = e.target.value
    });

    titleContainer.append(title);
    container.append(titleContainer);

    this._rolls.forEach((roll) => {
      container.append(roll.render());
    });

    let addRollButtonContainer = jQuery('<li />').addClass('editOnly');
    let addRollButton = jQuery('<input type="button" />').addClass('squareButton').addClass('small').val('Add Roll');
    addRollButton.click((e) => {
      let newRoll = this.addRoll("", "");
      jQuery(e.target).before(newRoll.render());
    });
    addRollButtonContainer.append(addRollButton);
    container.append(addRollButtonContainer);

    this._view = container;
    return container;
  }
  deleteEmptyRolls() {
    for(let i=this._rolls.length-1; i>= 0; i--) {
      let roll = this._rolls[i];
      if(roll.isEmpty()) {
        roll.remove();
        this._rolls.splice(i, 1);
      }
    }
  }
  isEmpty() {
    return (this._rolls.length === 0);
  }
  remove() {
    this._view.remove();
  }
}

class Roll {
  constructor(name, set) {
    this._name = name;
    this._set = set;
    Object.defineProperty(this, '_view', { value: null, writable: true });
  }
  render() {
    let container = jQuery('<li />');
    let label = jQuery('<div />').addClass('roll_label');
    let labelInput = jQuery('<input type="text" placeholder="Roll" />').val(this._name);
    labelInput.change((e) => { this._name = e.target.value });
    label.append(labelInput);
    let set = jQuery('<div />').addClass('roll_set');
    let setInput = jQuery('<input type="text" placeholder="1d20" pattern="[1-9,d,D]" />').val(this._set);
    setInput.change((e) => { this._set = e.target.value.toUpperCase(); });
    setInput.keypress((e) => {
      let keyCode = e.which;
      let allowedChars = [
        //32, //Spacebar
        43, //+
        45, //-
        68, //d
        100, //D
      ]
      if ( !(keyCode >= 48 && keyCode <= 57) && !allowedChars.includes(keyCode))
        e.preventDefault();
    });
    set.append(setInput);
    container.append(label).append(set);
    this._view = container;
    return container;
  }
  remove() {
    this._view.remove();
  }
  isEmpty() {
    return (this._name.trim() === '' && this._set.trim() === '');
  }
}
