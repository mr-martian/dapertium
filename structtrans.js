var deleteDiv = function(e) {
  var node = e.path[1];
  var parent = e.path[2];
  if (parent.tagName == 'LI') {
    parent = e.path[3];
    node = e.path[2];
  }
  var mode = parent.getAttribute('data-must-contain');
  var count = parent.getAttribute('data-child-count');
  if (count == '1') {
    parent.replaceChild(jsonActionToDom({tag:mode}, node.classList[1]), node);
  } else {
    parent.removeChild(node);
  }
  delete node;
};
var mkel = function(tag, cls, opts) {
  var ret = document.createElement(tag);
  if (cls) {
    ret.className = cls;
  }
  if (opts) {
    for (var k in opts) {
      ret[k] = opts[k];
    }
  }
  return ret;
};
var delMouseIn = function(e) {
  e.path[1].style.background = '#eeeeee';
};
var delMouseOut = function(e) {
  e.path[1].style.background = '';
};
var deleteButton = function(div) {
  div.insertBefore(mkel('span', 'delete', {onclick:deleteDiv, onmouseover:delMouseIn, onmouseout:delMouseOut, innerText:'X', title:'Delete'}), div.firstChild);
};
var commentBox = function(json) {
  var ret = mkel('div', 'commentbox', {innerHTML:'<span>Comment:</span><input type="text" class="comment"></input>'});
  if (json.hasOwnProperty('c')) {
    ret.children[1].value = json.c;
  }
  return ret;
};
var __checkboxid = 0;
var checkbox = function(lab, cls, checked) {
  var id = '_checkbox'+(__checkboxid++);
  var ret = mkel('div', 'checkbox '+cls, {innerHTML:'<label for="'+id+'">'+lab+':</label><input id="'+id+'" type="checkbox"></input>'});
  ret.children[1].checked = checked;
  return ret;
};
var readCheck = function(node, cls) {
  return node.getElementsByClassName(cls)[0].children[1].checked;
};
var txtAttr = function(json, attr) {
  return mkel('input', attr, {type:'text', value:json[attr]||''});
};
var readTxt = function(node, attr) {
  return node.getElementsByClassName(attr).value;
};
var addVariable = function(pass) {
  // TODO: set focus to variable adding section
};
var updateVars = function(pass) {
  // TODO: find all <var>s and update option lists
};
var listBox = function(pass) {
  var s = '';
  var lists = Object.keys(DATA[pass].lists);
  lists.sort()
  for (var i = 0; i < lists.length; i++) {
    s += '<option value="'+lists[i]+'">'+lists[i]+'</option>';
  }
  var ret = mkel('select', 'list');
  ret.innerHTML = s;
  return ret;
};
var moveUp = function(e) {
  if (e.path[2].previousSibling) {
    e.path[3].insertBefore(e.path[2], e.path[2].previousSibling);
  }
};
var moveDown = function(e) {
  // ignore final blank node
  if (e.path[2].nextSibling.nextSibling) {
    e.path[3].insertBefore(e.path[2], e.path[2].nextSibling.nextSibling);
  }
};
var holderLi = function(count, node) {
  var ret = mkel('li', 'mobile');
  if (count[0] == '!') {
    var move = mkel('div', 'reorder', {innerHTML:'<span>↑</span><br><span>↓</span>'});
    move.children[0].onclick = moveUp;
    move.children[2].onclick = moveDown;
    ret.appendChild(move);
    ret.appendChild(node);
  } else {
    ret.appendChild(node);
  }
  return ret;
};
var actionHolder = function(contain, count, children, pass) {
  var ret;
  if (children && children.__proto__ != Array.prototype) {
    children = [children];
  }
  if (count == '1') {
    ret = mkel('div', 'action-holder');
    if (children) {
      ret.appendChild(jsonActionToDom(children[0], pass));
    } else {
      ret.appendChild(jsonActionToDom({tag:contain}, pass));
    }
  } else {
    ret = mkel((count[0] == '!' ? 'ol' : 'ul'), 'action-holder');
    if (children) {
      var li;
      for (var i = 0; i < children.length; i++) {
        ret.appendChild(holderLi(count, jsonActionToDom(children[i], pass)));
      }
    }
    ret.appendChild(holderLi('?', jsonActionToDom({tag:contain}, pass)));
  }
  ret.setAttribute('data-must-contain', contain);
  ret.setAttribute('data-child-count', count);
  return ret;
};
var blankSelect = function(e) {
  var node = jsonActionToDom({tag:e.path[0].value}, e.path[1].classList[1]);
  if (e.path[2].tagName == 'LI') {
    e.path[3].insertBefore(holderLi(e.path[3].getAttribute('data-child-count'), node), e.path[2]);
  } else {
    e.path[2].replaceChild(node, e.path[1]);
    delete e.path[1];
  }
};
var jsonActionToDom = function(json, pass) {
  var defaultDom = function(js) {
    var ret = mkel('div', 'act '+pass+' '+js.tag);
    ret.appendChild(mkel('span', null, {innerText:js.tag}));
    if (js.children) {
      for (var i = 0; i < js.children.length; i++) {
        ret.appendChild(jsonActionToDom(js.children[i], pass));
      }
    }
    var ls = '';
    for (var k in js) {
      if (k != 'tag' && k != 'children') {
        ret.setAttribute('data-'+k, js[k]);
        ls += '<li><b>'+k+'</b> '+js[k]+'</li>';
      }
    }
    if (ls.length > 0) {
      ret.appendChild(mkel('ul', 'attrs', {innerHTML:ls}));
    }
    deleteButton(ret);
    return ret;
  };
  var basic = {'conj':['conj','',false], 'blank-conj':['conj','',false],
               'clip':['','Copy',false],
               'b':['','Space',false],
               'lit':['literal','Literal',false], 'lit-tag':['literal','Literal',false],
               'let':['let inline-kids','Set',false],
               'var':['','Variable',false],
               'comp':['comp','Check that',false], 'blank-comp':['comp','Check that',false],
               'test':['','Test',true], 'choose':['','Do one of the following:',true], 'when':['','If',true], 'otherwise':['','Otherwise',true],
               'condition':['','Condition',false], 'container':['','Container',false], 'sentence':['','Sentence',false],
               'value':['','Value',false], 'stringvalue':['','String Value',false]};
  if (basic.hasOwnProperty(json.tag)) {
    var ret = mkel('div', 'act '+pass+' '+basic[json.tag][0]||json.tag, {innerHTML:'<span>'+basic[json.tag][1]+'</span>'});
    if (basic[json.tag][2]) {
      ret.appendChild(commentBox(json));
    }
  }
  var divcls = 'act '+pass+' '+json.tag;
  switch (json.tag) {
    case "b":
      ret.innerHTML += '<span>(corresponding to the original space after word</span><input type="number" class="pos" title="may be left blank"></input><span style="padding-left:0px;">)</span>';
      ret.children[2].value = json.pos;
      break;
    case "conj":
    case "blank-conj":
      ret.innerHTML = '<select class="conjmode"><option value="blank-conj">----</option><option value="and">All</option><option value="or">Some</option><option value="not-and">Not all</option><option value="not-or">None</option></select><span>of the following are true:</span>';
      ret.children[0].value = json.mode;
      ret.appendChild(actionHolder('condition', '++', json.children, pass));
      break;
    case "clip":
      ret.innerHTML += '<input type="text" class="clip-part"></input><span>of input word</span><input class="pos" type="number" min="1"></input><span>in</span><select class="side"><option value="sl">Source</option><option value="tl">Target</option></select><span>Language</span><br>';
      ret.children[1].value = json.part;
      ret.children[3].value = json.pos;
      ret.children[5].value = json.side;
      ret.appendChild(checkbox('Queue', 'queue', json.queue != 'no'));
      ret.appendChild(commentBox(json));
      // TODO: I'm really not sure what the "link-to" attribute does
      break;
    case "lit":
    case "lit-tag":
      ret.appendChild(txtAttr(json, 'v'));
      ret.appendChild(checkbox('Tags', 'istags', json.tag == 'lit-tag'));
      break;
    case "not":
      json.children[0].tag = 'not-'+json.children[0].tag;
      return jsonActionToDom(json.children[0]);
    case "let":
      ret.appendChild(actionHolder('container', '1', (json.children?json.children[0]:null), pass));
      ret.appendChild(mkel('span', null, {innerText:'to'}));
      ret.appendChild(actionHolder('value', '1', (json.children?json.children[1]:null), pass));
      break;
    case "var":
      var s = '';
      for (var i = 0; i < DATA[pass].vars.length; i++) {
        s += '<option value="'+DATA[pass].vars[i].n+'">'+DATA[pass].vars[i].n+'</option>';
      }
      ret.innerHTML += '<select>'+s+'<option value="">Create New Variable</option></select>';
      ret.children[1].value = json.n;
      ret.children[1].onchange = function() {
        if (ret.children[1].value == "") {
          addVariable(pass);
        }
      };
      break;
    case "comp":
    case "blank-comp":
      ret.appendChild(actionHolder('value', '1', json.children[0], pass));
      var mode = mkel('select', 'comp-mode', {innerHTML:'<option value="equal">is</option><option value="begin">starts with</option><option value="end">ends with</option><option value="contains">contains</option><option value="not-equal">isn\'t</option><option value="not-begin">doesn\'t start with</option><option value="not-end">doesn\'t end with</option><option value="not-contains">doesn\'t contain</option>'});
      var list = mkel('select', 'comp-islist', {innerHTML:'<option value="value">the value</option><option value="list">something in</option>'});
      var other = mkel('div', 'comp-other');
      ret.appendChild(mode);
      ret.appendChild(list);
      ret.appendChild(other);
      mode.value = json.mode;
      list.value = json.islist;
      list.onchange = function(e) {
        if (mode.value == 'contains' && list.value == 'list') {
          other.innerHTML = '<span class="error">(substring match from list is not supported)</span>';
        } else if (list.value == 'list') {
          other.innerHTML = '';
          other.appendChild(listBox(pass));
        } else {
          other.innerHTML = '';
          other.appendChild(actionHolder('value', '1', null, pass));
        }
      };
      mode.onchange = list.onchange;
      if (json.islist == 'list') {
        other.appendChild(listBox(pass));
        other.firstChild.value = json.children[1].n;
      } else {
        other.appendChild(actionHolder('value', '1', json.children[1], pass));
      }
      ret.appendChild(checkbox('Case Sensitive', 'iscased', json.caseless != 'yes'));
      break;
    case "test":
      ret.appendChild(actionHolder('condition', '1', (json.children?json.children[0]:null), pass));
      break;
    case "choose":
      ret.appendChild(actionHolder('when', '!+', json.children, pass));
      ret.appendChild(actionHolder('otherwise', '1', json.otherwise, pass));
      break;
    case "when":
      ret.appendChild(actionHolder('test', '1', (json.children?json.children[0]:null), pass));
      ret.appendChild(mkel('span', '', {innerText:'Then'}));
      ret.appendChild(actionHolder('sentence', '!+', (json.children?json.children.slice(1):null), pass));
      break;
    case "otherwise":
      ret.appendChild(actionHolder('sentence', '!*', json.children, pass));
      break;
    case "condition":
    case "container":
    case "sentence":
    case "value":
    case "stringvalue":
      var buttons = {'condition':[['blank-conj','Conjuction'],['blank-comp','Comparison']],
                     'container':[['var','Variable'],['clip','Input Word']],
                     'sentence':['let','out','choose','modify-case','call-macro','append','reject-current-rule'],
                     'value':['b','clip','lit','lit-tag','var','get-case-from','case-of','concat','lu','mlu','chunk'],
                     'stringvalue':['clip','lit','var','get-case-from','case-of']};
      var b;
      for (var i = 0; i < buttons[json.tag].length; i++) {
        b = buttons[json.tag][i];
        if (b.__proto__ != Array.prototype) {
          b = [b,b];
        }
        ret.appendChild(mkel('button', '', {value:b[0], innerText:b[1], onclick:blankSelect}));
      }
      break;
    default:
      return defaultDom(json);
  }
  deleteButton(ret);
  return ret;
};
var domActionToJson = function(node) {
  switch (node.classList[2]) {
    case 'literal':
      return {tag:(readCheck(node, 'istags')?'lit-tag':'lit'), v:readTxt(node, 'v')};
    default:
      var ret = {tag:node.classList[2], children:[]};
      var kid;
      for (var i = 0; i < node.childNodes.length; i++) {
        kid = node.childNodes[i];
        if (kid.hasOwnProperty('value')) {
          ret[kid.className] = kid.value;
        } else if (kid.className) {
          if (kid.classList[0] == 'act') {
            ret.children.push(domActionToJson(kid));
          } else if (kid.classList[0] == 'checkbox') {
            ret[kid.classList[1]] = readCheck(kid);
          }
        }
      }
      return ret;
  }
};
var jsonActionToXml = function(json) {
  var ret = '<'+json.tag;
  var kids = '';
  for (var k in json) {
    if (k == 'tag') {
      continue;
    } else if (k == 'children') {
      kids = json[k].map(jsonToXml).join('\n');
    } else {
      ret += ' '+k+'="'+json[k]+'"';
    }
  }
  return ret+'>'+kids+'</'+json.tag+'>';
};
var jsonRuleToDom = function(rule, pass) {
  var ret = mkel('div', 'rule', {innerHTML:'<span class="rule-name">'+rule.comment+'</span><ol></ol>'});
  for (var i = 0; i < rule.pattern.length; i++) {
    ret.children[1].innerHTML += '<li>'+rule.pattern[i]+'</li>';
  }
  ret.appendChild(jsonActionToDom(rule.action, pass));
  return ret;
};
var setup = function() {
  ch = document.getElementById('chunker');
  for (var i = 0; i < DATA.chunker.rules.length; i++) {
    ch.appendChild(jsonRuleToDom(DATA.chunker.rules[i], 'chunker'));
  }
  ch = document.getElementById('interchunk');
  for (var i = 0; i < DATA.interchunk.rules.length; i++) {
    ch.appendChild(jsonRuleToDom(DATA.interchunk.rules[i], 'interchunk'));
  }
  ch = document.getElementById('postchunk');
  for (var i = 0; i < DATA.postchunk.rules.length; i++) {
    ch.appendChild(jsonRuleToDom(DATA.postchunk.rules[i], 'postchunk'));
  }
};
