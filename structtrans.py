#!/usr/bin/env python3
import xml.etree.ElementTree
import argparse
from collections import defaultdict
import json
parser = argparse.ArgumentParser(description='Generate human-readable summaries of Apertium structural transfer rules and bilingual dictionaries.')
files = parser.add_mutually_exclusive_group(required=True)
files.add_argument('-f', '--files', type=str, nargs=4, metavar=('chunker', 'interchunk', 'postchunk', 'dix'))
files.add_argument('-d', '--dir', type=str, metavar='datadir')
parser.add_argument('langs', type=str)
parser.add_argument('-o', '--outfile', type=str)
args = parser.parse_args()
if args.dir:
    name = '%s/apertium-%s.%s.' % (args.dir, args.langs, args.langs)
    CH = xml.etree.ElementTree.parse(name+'t1x').getroot()
    ICH = xml.etree.ElementTree.parse(name+'t2x').getroot()
    PCH = xml.etree.ElementTree.parse(name+'t3x').getroot()
    DIX = xml.etree.ElementTree.parse(name+'dix').getroot()
else:
    CH = xml.etree.ElementTree.parse(args.chunkerfile).getroot()
    ICH = xml.etree.ElementTree.parse(args.interchunkfile).getroot()
    PCH = xml.etree.ElementTree.parse(args.postchunkfile).getroot()
    DIX = xml.etree.ElementTree.parse(args.dixfile).getroot()

Tags = {}
for t in DIX.findall('./sdefs/sdef'):
    if 'n' in t.attrib:
        if 'c' in t.attrib:
            Tags[t.attrib['n']] = t.attrib['c']
        else:
            Tags[t.attrib['n']] = None
def listify(doc, path, alt=None):
    ret = {}
    for cat in doc.findall('./section-def-%ss/%s' % (path, alt or 'def-'+path)):
        ret[cat.attrib['n']] = []
        for it in cat:
            ret[cat.attrib['n']].append(it.attrib)
    return ret
Cats1 = listify(CH, 'cat')
Cats2 = listify(ICH, 'cat')
Cats3 = listify(PCH, 'cat')
Attrs1 = listify(CH, 'attr')
Attrs2 = listify(ICH, 'attr')
Attrs3 = listify(PCH, 'attr')
Lists1 = listify(CH, 'list', 'list-item')
Lists2 = listify(ICH, 'list', 'list-item')
Lists3 = listify(PCH, 'list', 'list-item')
Vars1 = [v.attrib for v in CH.findall('./section-def-vars/def-var')]
Vars2 = [v.attrib for v in ICH.findall('./section-def-vars/def-var')]
Vars3 = [v.attrib for v in PCH.findall('./section-def-vars/def-var')]
# TODO: macros
class HtmlTag:
    def __init__(self, tag, ID=None, cls=None, kids=None, attr=None):
        self.tag = tag
        self.ID = ID or ''
        self.cls = cls or []
        self.kids = kids or []
        self.attr = attr or {}
    def __str__(self):
        i = 'id="%s"' % self.ID if self.ID else ''
        c = 'class="%s"' % ' '.join(self.cls) if self.cls else ''
        a = []
        for k in self.attr:
            a.append('%s="%s"' % (k, self.attr[k].replace('"', '&quot;').replace("'", '&apos;')))
        k = [str(x) for x in self.kids]
        return '<%s %s %s %s>%s</%s>' % (self.tag, i, c, ' '.join(a), '\n'.join(k), self.tag)
    def __repr__(self):
        return self.__str__()
    def label(self, txt, loc=0):
        self.kids.insert(loc, HtmlTag('span', kids=[txt]))
class Action:
    unique = 0
    def __init__(self, xml):
        self.tag = xml.tag
        self.attrib = xml.attrib
        self.children = [Action(x) for x in xml]
    def json(self):
        ret = self.attrib
        ret['tag'] = self.tag
        ch = []
        for c in self.children:
            if isinstance(c, str):
                ch.append(c)
            else:
                ch.append(c.json())
        ret['children'] = ch
        return ret
    def html(self):
        ret = HtmlTag('div', 'act%s' % Action.unique, ['act', self.tag], [c.html() for c in self.children], {'data-attrs':json.dumps(self.attrib)})
        Action.unique += 1
        span = self.tag
        if self.tag == "action":
            pass
        elif self.tag == "and":
            pass
        elif self.tag == "append":
            pass
        elif self.tag == "b":
            span = 'Space'
        elif self.tag == "begins-with":
            pass
        elif self.tag == "begins-with-list":
            pass
        elif self.tag == "call-macro":
            pass
        elif self.tag == "case-of":
            pass
        elif self.tag == "choose":
            pass
        elif self.tag == "chunk":
            pass
        elif self.tag == "clip":
            pass
        elif self.tag == "concat":
            pass
        elif self.tag == "contains-substring":
            pass
        elif self.tag == "ends-with":
            pass
        elif self.tag == "ends-with-list":
            pass
        elif self.tag == "equal":
            span = ''
            ret.cls.append('inline-kids')
            ret.label('=', 1)
            if 'caseless' in self.attrib and self.attrib['caseless'] == 'yes':
                ret.kids.append('<br/><span>ignoring case</span>')
        elif self.tag == "get-case-from":
            pass
        elif self.tag == "in":
            pass
        elif self.tag == "let":
            span = ''
            ret.cls.append('inline-kids')
            ret.label('Set')
            ret.label('to', 2)
        elif self.tag == "list":
            pass
        elif self.tag == "lit":
            return '<span class="lit"><b>%s</b></span>' % self.attrib['v']
        elif self.tag == "lit-tag":
            return '<span class="lit-tag"><b>&lt;%s&gt;</b></span>' % '&gt;&lt;'.join(self.attrib['v'].split('.'))
        elif self.tag == "lu":
            pass
        elif self.tag == "mlu":
            pass
        elif self.tag == "modify-case":
            pass
        elif self.tag == "not":
            pass
        elif self.tag == "or":
            pass
        elif self.tag == "otherwise":
            pass
        elif self.tag == "out":
            pass
        elif self.tag == "reject-current-rule":
            pass
        elif self.tag == "tag":
            pass
        elif self.tag == "tags":
            pass
        elif self.tag == "test":
            ret.cls = ['inline']
            span = ''
        elif self.tag == "var":
            span = 'Variable <b>%s</b>' % self.attrib['n']
        elif self.tag == "when":
            span = ''
            ret.label('If')
            ret.kids.insert(2, '<br/><span>Then</span>')
        elif self.tag == "with-param":
            pass
        if span:
            ret.label(span)
        return ret
class Rule:
    def __init__(self, xml):
        self.pattern = [p.attrib['n'] for p in xml.findall('./pattern/pattern-item')]
        self.action = Action(xml.find('./action'))
        self.attrib = xml.attrib
    def json(self):
        ret = self.attrib
        ret.update({'pattern':self.pattern, 'action':self.action.json()})
        return ret
    def html(self):
        return '<div class="rule"><ul><li>%s</li></ul>%s</div>' % ('</li><li>'.join(self.pattern), str(self.action.html()))
Rules1 = [Rule(x) for x in CH.findall('./section-rules/rule')]
Rules2 = [Rule(x) for x in ICH.findall('./section-rules/rule')]
Rules3 = [Rule(x) for x in PCH.findall('./section-rules/rule')]
fname = args.outfile or args.langs + '-struct-trans.html'
print('Writing to %s' % fname)
f = open(fname, 'w')
html = '''<html><head>
<title>Structural Transfer Summary for %s</title>
<style>
span { padding: 5px; }
.inline-kids > .act, .inline { display: inline-block; }
.act {
    padding-left: 5px;
    border: 1px solid black;
    width: -webkit-max-content;
    width: -moz-max-content;
    width: max-content;
    border-radius: 10px;
}
</style>
</head>
<body>
<h1>Chunker</h1>%s
<h1>Interchunk</h1>%s
<h1>Postchunk</h1>%s
</body></html>''' % (args.langs, '\n'.join([x.html() for x in Rules1]), '\n'.join([x.html() for x in Rules2]), '\n'.join([x.html() for x in Rules3]))
f.write(html)
f.close()
js = {'tags':Tags,
      'chunker':{'cats':Cats1,
                 'attrs':Attrs1,
                 'lists':Lists1,
                 'vars':Vars1,
                 #'macros':Macros1,
                 'rules':[x.json() for x in Rules1]
      },
      'interchunk':{'cats':Cats2,
                    'attrs':Attrs2,
                    'lists':Lists2,
                    'vars':Vars2,
                    #'macros':Macros2,
                    'rules':[x.json() for x in Rules2]
      },
      'postchunk':{'cats':Cats3,
                  'attrs':Attrs3,
                  'lists':Lists3,
                  'vars':Vars3,
                  #'macros':Macros3,
                  'rules':[x.json() for x in Rules3]
      }}
f = open(args.outfile or args.langs + '-struct-trans-edit.html', 'w')
f.write('''<html><head><link rel="stylesheet" href="dapertium/structtrans.css"></link><script src="dapertium/structtrans.js"></script>
<title>Structural Transfer Editor for %s</title>
<script>var DATA = %s;</script>
<body>
<h1>Chunker</h1>
<div id="chunker"></div>
<h1>Interchunk</h1>
<div id="interchunk"></div>
<h1>Postchunk</h1>
<div id="postchunk"></div>
<script>setup();</script>
</body></html>''' % (args.langs, json.dumps(js)))
f.close()
