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
class Rule:
    def __init__(self, xml):
        self.pattern = [p.attrib['n'] for p in xml.findall('./pattern/pattern-item')]
        self.action = Action.fromxml(xml.find('./action'))
        self.attrib = xml.attrib
    def json(self):
        ret = self.attrib
        ret.update({'pattern':self.pattern, 'action':self.action.process().json()})
        return ret
Rules1 = [Rule(x) for x in CH.findall('./section-rules/rule')]
Rules2 = [Rule(x) for x in ICH.findall('./section-rules/rule')]
Rules3 = [Rule(x) for x in PCH.findall('./section-rules/rule')]
fname = args.outfile or args.langs + '-struct-trans.html'
print('Writing to %s' % fname)
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
f = open(fname, 'w')
f.write('''<html><head><link rel="stylesheet" href="dapertium/structtrans.css"></link><script src="dapertium/structtrans.js"></script>
<title>Structural Transfer Editor for %s</title>
<script>var DATA = %s;</script>
<meta charset="utf-8"/>
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
