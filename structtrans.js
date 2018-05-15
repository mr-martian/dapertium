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
var holderLi = function(contain, node) {
  var ret = mkel('li');
  if (contain[0] == '!') {
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
  if (count == '1') {
    ret = mkel('div', 'action-holder');
    ret.appendChild(jsonActionToDom({tag:contain}, pass));
  } else {
    ret = mkel((contain[0] == '!' ? 'ol' : 'ul'), 'action-holder');
    if (children) {
      var li;
      for (var i = 0; i < children.length; i++) {
        ret.appendChild(holderLi(contain, jsonActionToDom(children[i], pass)));
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
    e.path[3].insertBefore(holderLi(e.path[3].getAttribute('data-must-contain'), node), e.path[2]);
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
  var divcls = 'act '+pass+' '+json.tag;
  switch (json.tag) {
    case "and":
    case "or":
    case "nand":
    case "nor":
    case "blank-conj":
      var ret = mkel('div', 'act '+pass+' conj', {innerHTML:'<select class="conjmode"><option value="blank-conj">----</option><option value="and">All</option><option value="or">Some</option><option value="nand">Not all</option><option value="nor">None</option></select><span>of the following are true:</span><ul class="conj-parts"></ul>'});
      ret.children[0].value = json.tag;
      ret.appendChild(actionHolder('condition', '++', json.children, pass));
      deleteButton(ret);
      return ret;
    case "clip":
      var ret = mkel('div', divcls, {innerHTML:'<span>Copy</span><input type="text" class="clip-part"></input><span>of input word</span><input class="pos" type="number" min="1"></input><span>in</span><select class="side"><option value="sl">Source</option><option value="tl">Target</option></select><span>Language</span><br>'});
      ret.children[1].value = json.part;
      ret.children[3].value = json.pos;
      ret.children[5].value = json.side;
      ret.appendChild(checkbox('Queue', 'queue', json.queue != 'no'));
      ret.appendChild(commentBox(json));
      deleteButton(ret);
      // TODO: I'm really not sure what the "link-to" attribute does
      return ret;
    case "lit":
    case "lit-tag":
      var ret = mkel('div', 'act '+pass+' literal', {innerHTML:'<span>Literal</span>'});
      ret.appendChild(txtAttr(json, 'v'));
      ret.appendChild(checkbox('Tags', 'istags', json.tag == 'lit-tag'));
      deleteButton(ret);
      return ret;
    case "not":
      if (json.children[0].tag == "and") {
        json.children[0].tag = "nand";
        return jsonActionToDom(json.children[0], pass);
      } else if (json.children[0].tag == "or") {
        json.children[0].tag = "nor";
        return jsonActionToDom(json.children[0], pass);
      } else {
        return defaultDom(json);
      }
    case "let":
      var ret = mkel('div', divcls+' inline-kids', {innerHTML:'<span>Set</span>'});
      ret.appendChild(jsonActionToDom(json.children[0], pass));
      ret.appendChild(mkel('span', null, {innerText:'to'}));
      ret.appendChild(jsonActionToDom(json.children[1], pass));
      deleteButton(ret);
      return ret;
    case "var":
      var s = '';
      for (var i = 0; i < DATA[pass].vars.length; i++) {
        s += '<option value="'+DATA[pass].vars[i].n+'">'+DATA[pass].vars[i].n+'</option>';
      }
      var ret = mkel('div', divcls, {innerHTML:'<span>Variable</span><select>'+s+'<option value="">Create New Variable</option></select>'});
      ret.children[1].value = json.n;
      ret.children[1].onchange = function() {
        if (ret.children[1].value == "") {
          addVariable(pass);
        }
      };
      return ret;
    case "condition":
      var ret = mkel('div', divcls, {innerHTML:'<span>Condition</span><button value="blank-conj">Conjunction</button><button value="blank-comp">Comparison</button>'});
      ret.children[1].onclick = blankSelect;
      ret.children[2].onclick = blankSelect;
      return ret;
    /*case "container":
      break;
    case "sentence":
      break;
    case "value":
      break;
    case "stringvalue":
      break;*/
    default:
      return defaultDom(json);
  }
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
