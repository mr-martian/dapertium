/*
TODO:
Tags:
  dumping data, haven't formatted:
    append, modify-case, mlu, lu, chunk, tags, tag
  varies between t1x/t2x/t3x:
    out, get-case-from, case-of, chunk, pseudolemma, tags, tag, lu-count, pattern, cat-item
update dropdowns
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
var collapseButton = function(div) {
  div.insertBefore(mkel('span', 'collapse', {onclick:collapseDiv, innerText:'⏬', title:'Collapse'}), div.firstChild);
};
var collapseDiv = function(e) {
  var nodes = e.path[1].children;
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].className == 'delete') {
    } else if (nodes[i].className == 'collapse') {
      nodes[i].title = (nodes[i].title == 'Collapse' ? 'Expand' : 'Collapse');
      nodes[i].innerText = (nodes[i].innerText == '⏩' ? '⏬' : '⏩');
    } else if (nodes[i].style.display == 'none') {
      nodes[i].style.display = nodes[i].getAttribute('data-display');
    } else {
      nodes[i].setAttribute('data-display', nodes[i].style.display);
      nodes[i].style.display = 'none';
    }
  }
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
    children = [json[prop]];
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
    if (!isNaN(prop)) {
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
  return into;
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
               'value':['Value',false], 'stringvalue':['String Value',false], 'clip-lit-var':['',false], 'chunk-item':['',false],
               'concat':['Concatenate:',false],
               'reject-current-rule':['Quit applying this entire rule and try again',false],
               'call-macro':['Call macro',false],
               'rule':['Rule',false], 'pattern':['When you see this:',false], 'action':['Do This:',true],
               'pattern-item':['',false], 'blank-pattern-item':['',false], 'output-item':['',false],
               'out':['Output',true],
               'def-macro':['Macro',false],
               'def-cat':['Category',false], 'blank-def-cat':['',false], 'cat-item':['',false], 'blank-cat-item':['',false],
               'def-attr':['Attribute',false], 'blank-def-attr':['',false], 'attr-item':['',false], 'blank-attr-item':['',false],
               'def-var':['Variable',false], 'blank-def-var':['',false],
               'def-list':['List',false], 'blank-def-list':['',false], 'list-item':['',false], 'blank-list-item':['',false],
               // TODO: these probably need more work
               'append':['append',false], 'get-case-from':['get-case-from',false], 'case-of':['case-of',false], 'modify-case':['modify-case',false],
               'concat':['concat',false], 'mlu':['mlu',false], 'lu':['lu',false], 'chunk':['chunk',true], 'tags':['tags',false], 'tag':['tag',false]};
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
      ret.innerHTML += '<input type="text" class="part"></input><span>of input word</span><input class="pos" type="number" min="1"></input>';
      ret.children[1].value = json.part;
      ret.children[3].value = json.pos;
      if (pass == 'chunker') {
        ret.appendChild(mkel('span', '', {innerText:'in the'}));
        ret.appendChild(mkel('select', 'side', {innerHTML:'<option value="sl">Source</option><option value="tl">Target</option>'}));
        ret.appendChild(mkel('span', '', {innerText:'Language'}));
        ret.children[5].value = json.side;
        ret.appendChild(checkbox('Queue', 'queue', json.queue != 'no'));
        // TODO: I'm really not sure what the "link-to" attribute does
      }
      ret.appendChild(mkel('br'));
      ret.appendChild(commentBox(json));
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
      var mode = mkel('select', 'mode', {innerHTML:'<option value="equal">is exactly</option><option value="begin">starts with</option><option value="end">ends with</option><option value="contains">contains</option><option value="not-equal">isn\'t exactly</option><option value="not-begin">doesn\'t start with</option><option value="not-end">doesn\'t end with</option><option value="not-contains">doesn\'t contain</option>'});
      var list = mkel('select', 'islist', {innerHTML:'<option value="value">the value</option><option value="list">something in</option>'});
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
    case "blank-pattern-item":
    case "output-item":
    case "clip-lit-var":
    case "chunk-item":
    case "blank-def-cat":
    case "blank-cat-item":
    case "blank-def-attr":
    case "blank-attr-item":
    case "blank-def-var":
    case "blank-def-list":
    case "blank-list-item":
      var buttons = {'condition':[['conj','Conjuction'],['comp','Comparison']],
                     'container':[['var','Variable'],['clip','Input Word']],
                     'sentence':['let','out','choose','modify-case','call-macro','append',['reject-current-rule','Quit this rule']],
                     'value':['b','clip','lit','lit-tag','var','get-case-from','case-of','concat','lu','mlu','chunk'],
                     'stringvalue':['clip','lit',['var','Variable'],'get-case-from','case-of'],
                     'output-item':['mlu','lu','b','chunk',['var','Variable']],
                     'chunk-item':['mlu','lu','b','tags',['var','Variable']],
                     'clip-lit-var':[['clip','Input Word'],['lit','Literal'],['var','Variable']]};
      if (pass != 'chunker') {
        buttons.sentence.pop();
      }
      if (pass == 'interchunk') {
        buttons.value.pop();
        buttons.value.pop();
        buttons.value.pop();
        buttons.value.push('chunk');
        buttons['output-item'] = buttons['output-item'].slice(2);
        buttons['chunk-item'] = buttons['chunk-item'].slice(2);
      }
      if (pass == 'postchunk') {
        //buttons.value.push('lu-count');
        //buttons.stringvalue.push('lu-count');
      }
      if (json.tag.startsWith('blank-')) {
        var bls = [[json.tag.slice(6),'Add item']];
      } else {
        var bls = buttons[json.tag];
      }
      var b;
      for (var i = 0; i < bls.length; i++) {
        b = bls[i];
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
      ret.appendChild(chooseGlobal('macros', pass, json.n));
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
    case "rule":
      ret.appendChild(mkel('span', '', {innerText:'Name:'}));
      ret.appendChild(txtAttr(json, 'comment'));
      if (pass == 'chunker') {
        ret.appendChild(mkel('span', '', {innerText:'ID:'}));
        ret.appendChild(txtAttr(json, 'id'));
      }
      ret.appendChild(commentBox(json));
      ret.appendChild(actionHolder('pattern', '1', json, 'pattern', pass));
      ret.appendChild(actionHolder('action', '1', json, 'action', pass));
      break;
    case "pattern":
      ret.appendChild(actionHolder('blank-pattern-item', '!+', json, 'children', pass));
      break;
    case "pattern-item":
      ret.appendChild(chooseGlobal('cats', pass, json.n, 'n'));
      break;
    case "out":
      ret.appendChild(actionHolder('output-item', '!+', json, 'children', pass));
      break;
    case "def-macro":
      ret.appendChild(txtAttr(json, 'n'));
      ret.appendChild(mkel('span', '', {innerText:'Number of arguments:'}));
      ret.appendChild(mkel('input', 'npar', {value:json.npar||''}));
      ret.lastChild.type = 'number';
      ret.appendChild(commentBox(json));
      ret.appendChild(mkel('span', '', {innerText:'Other comment:'}));
      ret.appendChild(txtAttr(json, 'comment'));
      ret.appendChild(actionHolder('sentence', '!+', json, 'children', pass));
      break;
    case "def-cat":
      ret.appendChild(mkel('span', '', {innerText:'Name:'}));
      ret.appendChild(txtAttr(json, 'n'));
      ret.appendChild(commentBox(json));
      ret.appendChild(actionHolder('blank-cat-item', '+', json, 'children', pass));
      break;
    case "cat-item":
      ret.appendChild(mkel('span', '', {innerText:'Lemma:'}));
      ret.appendChild(txtAttr(json, 'lemma'));
      ret.appendChild(mkel('span', '', {innerText:'Tags:'}));
      ret.appendChild(txtAttr(json, 'tags'));
      ret.appendChild(commentBox(json));
      break;
    case "def-attr":
      ret.appendChild(mkel('span', '', {innerText:'Name:'}));
      ret.appendChild(txtAttr(json, 'n'));
      ret.appendChild(commentBox(json));
      ret.appendChild(actionHolder('blank-attr-item', '+', json, 'children', pass));
      break;
    case "attr-item":
      ret.appendChild(mkel('span', '', {innerText:'Tags:'}));
      ret.appendChild(txtAttr(json, 'tags'));
      ret.appendChild(commentBox(json));
      break;
    case "def-var":
      ret.appendChild(mkel('span', '', {innerText:'Name:'}));
      ret.appendChild(txtAttr(json, 'n'));
      ret.appendChild(mkel('span', '', {innerText:'Initial value:'}));
      ret.appendChild(txtAttr(json, 'v'));
      ret.appendChild(commentBox(json));
      break;
    case "def-list":
      ret.appendChild(mkel('span', '', {innerText:'Name:'}));
      ret.appendChild(txtAttr(json, 'n'));
      ret.appendChild(commentBox(json));
      ret.appendChild(actionHolder('blank-list-item', '+', json, 'children', pass));
      break;
    case "list-item":
      ret.appendChild(mkel('span', '', {innerText:'Value:'}));
      ret.appendChild(txtAttr(json, 'v'));
      ret.appendChild(commentBox(json));
      break;
    // TODO: see if these need more work
    case "append":
      ret.appendChild(mkel('span', '', {innerText:'n:'}));
      ret.appendChild(mkel('input', 'n', {value:json.n||''}));
      ret.appendChild(actionHolder('value', '!+', json, 'children', pass));
      break;
    case "modify-case":
      ret.appendChild(actionHolder('container', '1', json, 0, pass));
      ret.appendChild(actionHolder('stringvalue', '1', json, 1, pass));
      break;
    case "get-case-from":
      ret.appendChild(mkel('input', 'pos', {value:json.pos||''}));
      ret.appendChild(actionHolder('clip-lit-var', '1', json, 0, pass));
      break;
    case "case-of":
      ret.innerHTML += '<input type="text" class="clip-part"></input><span>of input word</span><input class="pos" type="number" min="1"></input><span>in</span><select class="side"><option value="sl">Source</option><option value="tl">Target</option></select><span>Language</span><br>';
      ret.children[1].value = json.part;
      ret.children[3].value = json.pos;
      ret.children[5].value = json.side;
      break;
    case "concat":
      ret.appendChild(actionHolder('value', '!+', json, 'children', pass));
      break;
    case "mlu":
      ret.appendChild(actionHolder('lu', '!+', json, 'children', pass));
      break;
    case "lu":
      ret.appendChild(actionHolder('value', '!+', json, 'children', pass));
      break;
    case "chunk":
      ret.appendChild(mkel('span', '', {innerText:'name:'}));
      ret.appendChild(txtAttr(json, 'name'));
      ret.appendChild(mkel('span', '', {innerText:'namefrom:'}));
      ret.appendChild(txtAttr(json, 'namefrom'));
      ret.appendChild(mkel('span', '', {innerText:'case:'}));
      ret.appendChild(txtAttr(json, 'case'));
      ret.appendChild(actionHolder('chunk-item', '!+', json, 'children', pass));
      break;
    case "tags":
      ret.appendChild(actionHolder('tag', '!+', json, 'children', pass));
      break;
    case "tag":
      ret.appendChild(actionHolder('value', '1', json, 'children', pass));
      break;
    default:
      alert('What is a '+json.tag+'?');
  }
  deleteButton(ret);
  ret.insertBefore(mkel('span', '', {innerText:json.tag}), ret.firstChild);
  ret.firstChild.style.display = 'none';
  ret.firstChild.setAttribute('data-display', 'inline');
  collapseButton(ret);
  return ret;
};
var domActionToJson = function(node) {
  var kids = function(n) {
    var ret = [];
    for (var i = 0; i < n.childNodes.length; i++) {
      if (!['BR', 'SPAN'].includes(n.childNodes[i].tagName)) {
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
  ret.tag = node.classList[2];
  for (var i = 0; i < todo.length; i++) {
    if (todo[i].classList[0] == 'action-holder') {
      ret = readActionHolder(todo[i], ret);
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
      delete ret.iscased;
      break;
  }
  return ret;
};
var reprocessJson = function(json) {
  var ret = {};
  for (var k in json) {
    if (json[k] == undefined) {
    } else if (k == 'children') {
      if (json[k].__proto__ == Array.prototype) {
        ret[k] = json[k].map(reprocessJson);
      } else {
        ret[k] = [reprocessJson(json[k])];
      }
    } else if (typeof json[k] == 'object') {
      ret[k] = reprocessJson(json[k]);
    } else {
      ret[k] = json[k];
    }
  }
  switch (ret.tag) {
    case 'comp':
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
      delete ret.mode;
      delete ret.islist;
      if (not) {
        ret = {tag:'not', children:[ret]};
      }
      break;
    case 'conj':
      var not = false;
      console.log(ret);
      if (ret.mode.startsWith('not-')) {
        not = true;
        ret.mode = ret.mode.slice(4);
      }
      ret.tag = ret.mode;
      delete ret.mode;
      if (not) {
        ret = {tag:'not', children:[ret]};
      }
      break;
    case 'choose':
      if (ret.otherwise) {
        ret.children.push(ret.otherwise);
        delete ret.otherwise;
      }
      break;
    case 'call-macro':
      ret.children = [];
      if (ret.params) {
        for (var i = 0; i < ret.params.length; i++) {
          ret.children.push({tag:'with-param', pos:ret.params[i]});
        }
      }
      delete ret.params;
      break;
    case 'rule':
      ret.children = [ret.pattern, ret.action];
      delete ret.pattern;
      delete ret.action;
      break;
    case 'literal':
      ret.tag = (ret.istags?'lit-tag':'lit');
      delete ret.istags;
      break;
    case 'when':
      ret.children = [ret.cond].concat(ret.children);
      delete ret.cond;
      break;
  }
  return ret;
};
var jsonActionToXml = function(json, indent) {
  if (!json) { return ''; }
  var required = {'def-cat':['n'],'cat-item':['tags'],'def-attr':['n'],'def-var':['n'],'def-list':['n'],'list-item':['v'],'def-macro':['n','npar'],'pattern-item':['n'],'list':['n'],'append':['n'],'call-macro':['n'],'with-param':['pos'],'clip':['pos','part'],'lit':['v'],'lit-tag':['v'],'var':['n'],'get-case-from':['pos'],'case-of':['pos','side','part']};
  indent = indent||'';
  var ret = indent+'<'+json.tag;
  var kids = '';
  var ls = Object.keys(json);
  if (json.tag == 'lit') { console.log(ls); console.log(json);  }
  ls.sort();
  var more = required[json.tag]||[];
  for (var i = 0; i < more.length; i++) {
    if (!json[more[i]] || json[more[i]] == '') {
      json[more[i]] = 1;
    }
  }
  var k;
  for (var j = 0; j < ls.length; j++) {
    k = ls[j];
    if (k == 'tag' || k == undefined || k == 'undefined' || json[k] == undefined) {
      continue;
    } else if (k == 'children') {
      for (var i = 0; i < json[k].length; i++) {
        kids += jsonActionToXml(json[k][i], indent+'  ')+'\n';
      }
    } else if (json[k] == 1) {
      ret += ' '+k+'=""';
    } else if (typeof json[k] == 'string' && json[k].length > 0) {
      ret += ' '+k+'="'+json[k]+'"';
    }
  }
  if (kids.length) {
    return ret+'>\n'+kids+indent+'</'+json.tag+'>';
  } else {
    return ret+'/>';
  }
};
var alltoxml = function() {
  var s;
  var parts = ['chunker', 'interchunk', 'postchunk'];
  for (var p = 0; p < parts.length; p++) {
    var xml = {tag:parts[p], children:[]};
    if (p == 0) {
      xml.tag = 'transfer';
    }
    var ch = document.getElementById(parts[p]);
    if (parts[p] == 'chunker') {
      xml['default'] = document.getElementById('chunker-default').value;
    }
    var ct = {tag:'section-def-cats'};
    readActionHolder(ch.getElementsByClassName('cat-block')[0].firstChild, ct);
    xml.children.push(ct);
    var at = {tag:'section-def-attrs'};
    readActionHolder(ch.getElementsByClassName('attr-block')[0].firstChild, at);
    if (p || at.children.length) {
      xml.children.push(at);
    }
    var vr = {tag:'section-def-vars'};
    readActionHolder(ch.getElementsByClassName('var-block')[0].firstChild, vr);
    if (p || vr.children.length) {
      xml.children.push(vr);
    }
    var ls = {tag:'section-def-lists'};
    readActionHolder(ch.getElementsByClassName('list-block')[0].firstChild, ls);
    if (ls.children.length) {
      xml.children.push(ls);
    }
    var mc = {tag:'section-def-macros'};
    readActionHolder(ch.getElementsByClassName('macro-block')[0].firstChild, mc);
    if (mc.children.length) {
      xml.children.push(mc);
    }
    var rls = {};
    readActionHolder(ch.getElementsByClassName('rule-block')[0].firstChild, rls);
    xml.children.push({tag:'section-rules', children:rls.rules});
    s = '<?xml version="1.0" encoding="UTF-8"?>\n';
    s += jsonActionToXml(reprocessJson(xml), '');
    document.body.appendChild(mkel('h2', '', {innerText:parts[p]}));
    document.body.appendChild(mkel('textarea', '', {value:s}));
  }
  //document.getElementById('final-output').innerText = s;
};
var setup = function() {
  passes = ['chunker', 'interchunk', 'postchunk'];
  for (var p = 0; p < passes.length; p++) {
    ch = document.getElementById(passes[p]);
    ch.appendChild(mkel('h3', '', {innerText:'Categories'}));
    ch.appendChild(mkel('div', 'cat-block'));
    ch.lastChild.appendChild(actionHolder('blank-def-cat', '+', DATA[passes[p]]['cat-block'], 'children', passes[p]));
    ch.appendChild(mkel('h3', '', {innerText:'Attributes'}));
    ch.appendChild(mkel('div', 'attr-block'));
    ch.lastChild.appendChild(actionHolder('blank-def-attr', '+', DATA[passes[p]]['attr-block'], 'children', passes[p]));
    ch.appendChild(mkel('h3', '', {innerText:'Variables'}));
    ch.appendChild(mkel('div', 'var-block'));
    ch.lastChild.appendChild(actionHolder('blank-def-var', '+', DATA[passes[p]]['var-block'], 'children', passes[p]));
    ch.appendChild(mkel('h3', '', {innerText:'Lists'}));
    ch.appendChild(mkel('div', 'list-block'));
    ch.lastChild.appendChild(actionHolder('blank-def-list', '+', DATA[passes[p]]['list-block'], 'children', passes[p]));
    ch.appendChild(mkel('h3', '', {innerText:'Macros'}));
    ch.appendChild(mkel('div', 'macro-block'));
    var ls = Object.keys(DATA[passes[p]].macros);
    ls.sort();
    var block = ls.map(function(x) { return DATA[passes[p]].macros[x]; });
    ch.lastChild.appendChild(actionHolder('def-macro', '*', {children:block}, 'children', passes[p]));
    ch.appendChild(mkel('h3', '', {innerText:'Rules'}));
    ch.appendChild(mkel('div', 'rule-block'));
    ch.lastChild.appendChild(actionHolder('rule', '+', DATA[passes[p]], 'rules', passes[p]));
  }
  if (DATA.chunker.hasOwnProperty('default')) {
    document.getElementById('chunker-default').value = DATA.chunker['default'];
  }
};
