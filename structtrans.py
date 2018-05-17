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

comparison = {'equal': ['equal', 'value'],
              'begins-with': ['begin', 'value'],
              'ends-with': ['end', 'value'],
              'contains-substring': ['contain', 'value'],
              'in': ['equal', 'list'],
              'begins-with-list': ['begin', 'list'],
              'ends-with-list': ['end', 'list']}
class Action:
    unique = 0
    def __init__(self, tag, a, ch):
        self.tag = tag
        self.attrib = a
        self.children = ch
    def fromxml(xml):
        return Action(xml.tag, xml.attrib, [Action.fromxml(x) for x in xml])
    def process(self):
        r = Action(self.tag, self.attrib, [x.process() for x in self.children])
        if self.tag == 'not':
            r = r.children[0]
            r.attrib['mode'] = 'not-'+r.attrib['mode']
        elif self.tag in comparison:
            r.attrib['mode'] = comparison[self.tag][0]
            r.attrib['islist'] = comparison[self.tag][1]
            r.tag = 'comp'
        elif self.tag in ['and', 'or']:
            r.attrib['mode'] = self.tag
            r.tag = 'conj'
        elif self.tag == 'choose':
            if r.children[-1].tag == 'otherwise':
                r.attrib['otherwise'] = r.children.pop()
        elif self.tag == 'when':
            r.attrib['cond'] = r.children.pop(0)
        elif self.tag == 'lit':
            r.tag = 'literal'
            r.attrib['istags'] = False
        elif self.tag == 'lit-tag':
            r.tag = 'literal'
            r.attrib['istags'] = True
        elif self.tag == 'rule':
            r.attrib['pattern'] = r.children[0]
            r.attrib['action'] = r.children[1]
            r.children = []
        else:
            pass
        return r
    def json(self):
        ret = {}
        for k in self.attrib:
            if isinstance(self.attrib[k], Action):
                ret[k] = self.attrib[k].json()
            else:
                ret[k] = self.attrib[k]
        ret['tag'] = self.tag
        ch = []
        for c in self.children:
            if isinstance(c, str):
                ch.append(c)
            else:
                ch.append(c.json())
        ret['children'] = ch
        return ret
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
Macros1 = {}
for cat in CH.findall('./section-def-macros/def-macro'):
    Macros1[cat.attrib['n']] = Action.fromxml(cat).process().json()
Macros2 = {}
for cat in ICH.findall('./section-def-macros/def-macro'):
    Macros2[cat.attrib['n']] = Action.fromxml(cat).process().json()
Macros3 = {}
for cat in PCH.findall('./section-def-macros/def-macro'):
    Macros3[cat.attrib['n']] = Action.fromxml(cat).process().json()
# TODO: macros
Rules1 = [Action.fromxml(x) for x in CH.findall('./section-rules/rule')]
Rules2 = [Action.fromxml(x) for x in ICH.findall('./section-rules/rule')]
Rules3 = [Action.fromxml(x) for x in PCH.findall('./section-rules/rule')]
def struc(c, n):
    f = c.findall('./section-def-'+n)
    if f:
        return Action.fromxml(f[0]).json()
    else:
        return Action('section-def-'+n, {}, []).json()
fname = args.outfile or args.langs + '-struct-trans.html'
print('Writing to %s' % fname)
js = {'tags':Tags,
      'chunker':{'cats':Cats1,
                 'cat-block':struc(CH, 'cats'),
                 'attrs':Attrs1,
                 'attr-block':struc(CH, 'attrs'),
                 'lists':Lists1,
                 'list-block':struc(CH, 'lists'),
                 'vars':Vars1,
                 'var-block':struc(CH, 'vars'),
                 'macros':Macros1,
                 'rules':[x.process().json() for x in Rules1]
      },
      'interchunk':{'cats':Cats2,
                    'cat-block':struc(ICH, 'cats'),
                    'attrs':Attrs2,
                    'attr-block':struc(ICH, 'attrs'),
                    'lists':Lists2,
                    'list-block':struc(ICH, 'lists'),
                    'vars':Vars2,
                    'var-block':struc(ICH, 'vars'),
                    'macros':Macros2,
                    'rules':[x.process().json() for x in Rules2]
      },
      'postchunk':{'cats':Cats3,
                   'cat-block':struc(PCH, 'cats'),
                   'attrs':Attrs3,
                   'attr-block':struc(PCH, 'attrs'),
                   'lists':Lists3,
                   'list-block':struc(PCH, 'lists'),
                   'vars':Vars3,
                   'var-block':struc(PCH, 'vars'),
                   'macros':Macros3,
                   'rules':[x.process().json() for x in Rules3]
      }}
if 'default' in CH.attrib:
    js['chunker']['default'] = CH.attrib['default']
f = open(fname, 'w')
f.write('''<html><head>
<meta charset="utf-8"/>
<link rel="stylesheet" href="dapertium/structtrans.css"></link><script src="dapertium/structtrans.js"></script>
<title>Structural Transfer Editor for %s</title>
<script>var DATA = %s;</script>
<body>
<h1>Chunker</h1>
<span>Unmatched words should be output as</span>
<select id="chunker-default"><option value="lu">Lexical Units</option><option value="chunk">Chunks</option></select>
<div id="chunker"></div>
<h1>Interchunk</h1>
<div id="interchunk"></div>
<h1>Postchunk</h1>
<div id="postchunk"></div>
<hr/>
<button onclick="alltoxml();">Export to XML</button>
<pre id="final-output"></pre>
<script>setup();</script>
</body></html>''' % (args.langs, json.dumps(js)))
f.close()
