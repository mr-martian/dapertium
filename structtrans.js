/*
TODO:
patterns
vars, macros, lists, attrs, cats
append, out, modify-case, mlu, lu, chunk, tags, tag
update dropdowns
dom -> json
output xml
validate
improve labels?
interpret rules?
*/
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
var readCheck = function(node) {
  return node.children[1].checked;
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
var chooseGlobal = function(type, pass, val, cls) {
  if (type == 'vars') {
    var lists = DATA[pass].vars.map(function(o) { return o.n; });
  } else if (type == 'macro') {
    var lists = [];
  } else {
    var lists = Object.keys(DATA[pass][type]);
  }
  lists.sort();
  var ret = mkel('select', type+' '+pass);
  for (var i = 0; i < lists.length; i++) {
    ret.appendChild(mkel('option', '', {innerText:lists[i], value:lists[i]}));
  }
  ret.appendChild(mkel('option', '', {innerText:'Create new '+type, value:'make new'}));
  ret.value = val;
  var realret = mkel('div', 'global '+cls);
  realret.appendChild(ret);
  return realret;
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
var actionHolder = function(contain, count, json, prop, pass) {
  var ret;
  var children;
  if (typeof prop == 'number') {
    if (json.children) {
      children = [json.children[prop]];
    }
  } else if (json[prop] && json[prop].__proto__ != Array.prototype) {
    children = [children];
  } else {
    children = json[prop];
  }
  if (count == '1') {
    ret = mkel('div', 'action-holder '+prop);
    if (children && children[0]) {
      ret.appendChild(jsonActionToDom(children[0], pass));
    } else {
      ret.appendChild(jsonActionToDom({tag:contain}, pass));
    }
  } else {
    ret = mkel((count[0] == '!' ? 'ol' : 'ul'), 'action-holder '+prop);
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
var readActionHolder = function(node, into) {
  var prop = node.classList[1];
  if (node.getAttribute('data-child-count') == '1') {
    var obj = domActionToJson(node.firstChild);
    if (Number(prop) != NaN) {
      if (!into.hasOwnProperty('children')) {
        into.children = [];
      }
      into.children[prop] = obj;
    } else {
      into[prop] = obj;
    }
  } else {
    into[prop] = [];
    for (var i = 0; i < node.children.length-1; i++) {
      into[prop].push(domActionToJson(node.children[i].lastChild));
    }
  }
};
var blankSelect = function(e) {
  var node = jsonActionToDom({tag:e.path[0].value, fromBlank:true}, e.path[1].classList[1]);
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
  var basic = {'conj':['',false],
               'clip':['Copy',false], 'case-of':['Copy the case of',false],
               'b':['Space',false],
               'literal':['Literal',false],
               'let':['Set',false],
               'var':['Variable',false],
               'comp':['Check that',false],
               'test':['Test',true], 'choose':['Do one of the following:',true], 'when':['If',true], 'otherwise':['Otherwise',true],
               'condition':['Condition',false], 'container':['Container',false], 'sentence':['Sentence',false],
               'value':['Value',false], 'stringvalue':['String Value',false],
               'action':['Do This:',true],
               'concat':['Concatenate:',false],
               'reject-current-rule':['Quit applying this entire rule and try again',false],
               'call-macro':['Call macro',false]};
  if (basic.hasOwnProperty(json.tag)) {
    var ret = mkel('div', 'act '+pass+' '+json.tag, {innerHTML:'<span>'+basic[json.tag][0]+'</span>'});
    if (basic[json.tag][1]) {
      ret.appendChild(commentBox(json));
    }
  }
  switch (json.tag) {
    case "b":
      ret.innerHTML += '<span>(corresponding to the original space after word</span><input type="number" class="pos" title="may be left blank"></input><span style="padding-left:0px;">)</span>';
      ret.children[2].value = json.pos;
      break;
    case "conj":
      ret.innerHTML = '<select class="conjmode"><option value="and">All</option><option value="or">Some</option><option value="not-and">Not all</option><option value="not-or">None</option></select><span>of the following are true:</span>';
      ret.children[0].value = json.mode;
      ret.appendChild(actionHolder('condition', '++', json, 'children', pass));
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
    case "case-of":
      ret.innerHTML += '<input type="text" class="clip-part"></input><span>of input word</span><input class="pos" type="number" min="1"></input><span>in</span><select class="side"><option value="sl">Source</option><option value="tl">Target</option></select><span>Language</span><br>';
      ret.children[1].value = json.part;
      ret.children[3].value = json.pos;
      ret.children[5].value = json.side;
      break;
    case "literal":
      ret.appendChild(txtAttr(json, 'v'));
      ret.appendChild(checkbox('Tags', 'istags', json.istags));
      break;
    case "not":
      json.children[0].tag = 'not-'+json.children[0].tag;
      return jsonActionToDom(json.children[0]);
    case "let":
      ret.appendChild(actionHolder('container', '1', json, 0, pass));
      ret.appendChild(mkel('span', null, {innerText:'to'}));
      ret.appendChild(actionHolder('value', '1', json, 1, pass));
      break;
    case "var":
      ret.appendChild(chooseGlobal('vars', pass, json.n, 'n'));
      break;
    case "comp":
      ret.appendChild(actionHolder('value', '1', json, 0, pass));
      var mode = mkel('select', 'select mode', {innerHTML:'<option value="equal">is exactly</option><option value="begin">starts with</option><option value="end">ends with</option><option value="contains">contains</option><option value="not-equal">isn\'t exactly</option><option value="not-begin">doesn\'t start with</option><option value="not-end">doesn\'t end with</option><option value="not-contains">doesn\'t contain</option>'});
      var list = mkel('select', 'select islist', {innerHTML:'<option value="value">the value</option><option value="list">something in</option>'});
      var other = mkel('div', 'place other');
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
          other.appendChild(actionHolder('value', '1', {}, 1, pass));
        }
      };
      mode.onchange = list.onchange;
      if (json.islist == 'list') {
        other.appendChild(listBox(pass));
        other.firstChild.value = json.children[1].n;
      } else {
        other.appendChild(actionHolder('value', '1', json, 1, pass));
      }
      ret.appendChild(checkbox('Case Sensitive', 'iscased', json.caseless != 'yes'));
      break;
    case "test":
      ret.appendChild(actionHolder('condition', '1', json, 0, pass));
      break;
    case "choose":
      ret.appendChild(actionHolder('when', '!+', json, 'children', pass));
      ret.appendChild(actionHolder('otherwise', '1', json, 'otherwise', pass));
      break;
    case "when":
      ret.appendChild(actionHolder('test', '1', json, 'cond', pass));
      ret.appendChild(mkel('span', '', {innerText:'Then'}));
      ret.appendChild(actionHolder('sentence', '!+', json, 'children', pass));
      break;
    case "otherwise":
      ret.appendChild(actionHolder('sentence', '!*', json, 'children', pass));
      break;
    case "condition":
    case "container":
    case "sentence":
    case "value":
    case "stringvalue":
      var buttons = {'condition':[['conj','Conjuction'],['comp','Comparison']],
                     'container':[['var','Variable'],['clip','Input Word']],
                     'sentence':['let','out','choose','modify-case','call-macro','append',['reject-current-rule','Quit this rule']],
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
      return ret;
    case "action":
      ret.appendChild(actionHolder('sentence', '!*', json, 'children', pass));
      break;
    case "concat":
      ret.appendChild(actionHolder('value', '!+', json, 'children', pass));
      break;
    case "reject-current-rule":
      ret.appendChild(checkbox('Start searching at the next position (rather than the current one)', 'shifting', json.shifting != 'no'));
      break;
    case "call-macro":
      ret.appendChild(chooseGlobal('macro', pass, json.n));
      ret.appendChild(actionHolder('with-param', '!*', json, 'children', pass));
      break;
    case "with-param":
      var ret = mkel('div');
      if (json.pos || json.fromBlank) {
        ret.appendChild(mkel('input', 'pos', {value:json.pos||''}));
        deleteButton(ret);
      } else {
        ret.appendChild(mkel('button', '', {value:'with-param', innerText:'add parameter', onclick:blankSelect}));
      }
      return ret;
    default:
      return defaultDom(json);
  }
  deleteButton(ret);
  return ret;
};
var domActionToJson = function(node) {
  var kids = function(n) {
    var ret = [];
    for (var i = 0; i < n.childNodes.length; i++) {
      if (n.childNodes[i].tagName != 'SPAN') {
        if (n.childNodes[i].classList[0] == 'place') {
          ret = ret.concat(kids(n.childNodes[i]));
        } else {
          ret.push(n.childNodes[i]);
        }
      }
    }
    return ret;
  };
  var todo = kids(node);
  var ret = {};
  console.log(node);
  ret.tag = node.classList[2];
  for (var i = 0; i < todo.length; i++) {
    if (todo[i].classList[0] == 'action-holder') {
      readActionHolder(todo[i], ret);
    } else if (todo[i].tagName == 'DIV') {
      if (todo[i].classList[0] == 'global') {
        ret[todo[i].classList[1]] = todo[i].children[0].value;
      } else if (todo[i].classList[0] == 'checkbox') {
        ret[todo[i].classList[1]] = readCheck(todo[i]);
      } else if (todo[i].classList[0] == 'commentbox') {
        ret.c = todo[i].children[1].value;
      }
    } else { // <select> or <input>
      ret[todo[i].classList[0]] = todo[i].value;
    }
  }
  switch (ret.tag) {
    case "comp":
      ret.caseless = ret.iscased?'no':'yes';
      ret.iscased = undefined;
      break;
  }
  return ret;
};
var reprocessJson = function(json) {
  var ret = {};
  for (var k in json) {
    if (k == 'children') {
      ret[k] = json[k].map(reprocessJson);
    } else if (typeof json[k] == 'object') {
      ret[k] = reprocessJson(json[k]);
    } else {
      ret[k] = json[k];
    }
  }
  switch (ret.tag) {
    case 'conj':
      var not = false;
      if (ret.mode.startsWith('not-')) {
        not = true;
        ret.mode = ret.mode.slice(4);
      }
      var tags = {'equal':{'value':'equal', 'list':'in'},
                  'begin':{'value':'begins-with', 'list':'begins-with-list'},
                  'end':{'value':'ends-with', 'list':'ends-with-list'},
                  'contain':{'value':'contains-substring'}};
      ret.tag = tags[ret.mode][ret.islist];
      ret.mode = undefined;
      ret.islist = undefined;
      if (not) {
        ret = {tag:'not', children:[ret]};
      }
      break;
    case 'comp':
      var not = false;
      if (ret.mode.startsWith('not-')) {
        not = true;
        ret.mode = ret.mode.slice(4);
      }
      ret.tag = ret.mode;
      ret.mode = undefined;
      if (not) {
        ret = {tag:'not', children:[ret]};
      }
      break;
    case 'choose':
      if (ret.otherwise) {
        ret.children.push(ret.otherwise);
        ret.otherwise = undefined;
      }
      break;
    case 'call-macro':
      ret.children = [];
      if (ret.params) {
        for (var i = 0; i < ret.params.length; i++) {
          ret.children.push({tag:'with-param', pos:ret.params[i]});
        }
      }
      ret.params = undefined;
      break;
  }
  return ret;
};
var jsonActionToXml = function(json, indent) {
  indent = indent||'';
  var ret = indent+'<'+json.tag;
  var kids = '';
  for (var k in json) {
    if (k == 'tag' || k == undefined || k == 'undefined') {
      continue;
    } else if (k == 'children') {
      for (var i = 0; i < json[k].length; i++) {
        kids += jsonActionToXml(json[k][i], indent+'  ')+'\n';
      }
    } else {
      ret += ' '+k+'="'+json[k]+'"';
    }
  }
  if (kids.length) {
    kids = '\n'+kids+indent;
  }
  return ret+'>'+kids+'</'+json.tag+'>';
};
var alltoxml = function() {
  var nodes = document.getElementsByClassName('action');
  var s = '';
  for (var i = 0; i < nodes.length; i++) {
    s += jsonActionToXml(reprocessJson(domActionToJson(nodes[i])), '') + '\n';
  }
  document.getElementById('final-output').innerText = s;
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
