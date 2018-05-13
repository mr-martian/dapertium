var jsonToDom = function(json) {
    switch (json.tag) {
        default:
            var ret = document.createElement('div');
            ret.innerHtml = '<span>'+json.tag+'</span>';
            ret.className = 'act '+json.tag;
            for (var i = 0; i < json.children.length; i++) {
                ret.appendChild(jsonToDom(json.children[i]));
            }
            for (var k in json) {
                if (k != 'tag' && k != 'children') {
                    ret.setAttribute(k, json[k]);
                }
            }
            return ret;
    }
};
var domToJson = function(node) {
    switch (node.className.split(' ')[1]) {
        case 'lit':
            return 'ha!';
        default:
            return {};
    }
};
var jsonToXml = function(json) {
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
