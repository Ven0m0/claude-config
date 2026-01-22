#!/usr/bin/env python3
"""Bash script analyzer: performance, standards, patterns."""
import re,sys,subprocess,json
from pathlib import Path
from collections import defaultdict

class BashAnalyzer:
  def __init__(self,script_path):
    self.path=Path(script_path)
    self.content=self.path.read_text()
    self.lines=self.content.splitlines()
    self.issues=defaultdict(list)
    self.stats={'subshells':0,'forks':0,'pipes':0,'vars':0,'functions':0}
  
  def analyze(self):
    self._check_shebang()
    self._check_options()
    self._count_forks_subshells()
    self._check_tool_usage()
    self._check_patterns()
    self._check_indentation()
    self._run_shellcheck()
    return self._format_results()
  
  def _check_shebang(self):
    if not self.lines or not self.lines[0].startswith('#!/usr/bin/env bash'):
      self.issues['critical'].append('Missing/wrong shebang (need: #!/usr/bin/env bash)')
  
  def _check_options(self):
    required={'set -euo pipefail','shopt -s nullglob','shopt -s globstar'}
    found=set()
    for line in self.lines[:20]:
      for opt in required:
        if opt in line: found.add(opt)
    missing=required-found
    if missing: self.issues['standards'].extend(f'Missing: {m}' for m in missing)
  
  def _count_forks_subshells(self):
    for i,line in enumerate(self.lines,1):
      clean=re.sub(r'#.*','',line)
      self.stats['subshells']+=clean.count('$(')
      self.stats['subshells']+=clean.count('`')
      if re.search(r'\|\s*\w+',clean): self.stats['pipes']+=1
      if re.search(r'\b(cat|echo|ls|which|type|basename|dirname)\b',clean): 
        self.stats['forks']+=1
        if 'cat' in clean and '|' in clean: self.issues['performance'].append(f'L{i}: unnecessary cat (use < redirect)')
        if 'echo' in clean: self.issues['performance'].append(f'L{i}: prefer printf over echo')
        if 'ls' in clean: self.issues['critical'].append(f'L{i}: parsing ls output (use arrays/globs)')
  
  def _check_tool_usage(self):
    tools={'find':'fd/fdfind','grep':'rg','sed':'sd','awk':'choose','xargs':'rust-parallel'}
    for i,line in enumerate(self.lines,1):
      for old,new in tools.items():
        if re.search(rf'\b{old}\b',line) and '#' not in line.split(old)[0]:
          self.issues['optimization'].append(f'L{i}: consider {new} → {old}')
  
  def _check_patterns(self):
    for i,line in enumerate(self.lines,1):
      if re.search(r'\[\s+.*\s+\]',line): self.issues['standards'].append(f'L{i}: use [[ ]] not [ ]')
      if '${' in line and not ('{#' in line or '/#' in line or '%' in line):
        if '$' in line and '"$' not in line and "'" not in line: self.issues['critical'].append(f'L{i}: unquoted variable expansion')
      if 'eval' in line: self.issues['critical'].append(f'L{i}: avoid eval')
      if re.search(r'function\s+\w+',line): self.issues['standards'].append(f'L{i}: prefer fn(){{}} over function fn')
  
  def _check_indentation(self):
    for i,line in enumerate(self.lines,1):
      if line and line[0]==' ' and (len(line)-len(line.lstrip()))%2!=0:
        self.issues['standards'].append(f'L{i}: use 2-space indent')
        break
  
  def _run_shellcheck(self):
    try:
      r=subprocess.run(['shellcheck','-f','json',str(self.path)],capture_output=True,text=True,timeout=5)
      if r.stdout:
        for issue in json.loads(r.stdout):
          lvl='critical' if issue['level']=='error' else 'standards'
          self.issues[lvl].append(f"L{issue['line']}: {issue['message']}")
    except: pass
  
  def _format_results(self):
    out=['=== BASH SCRIPT ANALYSIS ===',f'File: {self.path}','']
    out.append(f"Stats: {self.stats['subshells']} subshells | {self.stats['forks']} forks | {self.stats['pipes']} pipes")
    if self.stats['subshells']>10: out.append('⚠ High subshell count ⇒ performance impact')
    if self.stats['forks']>5: out.append('⚠ Excessive forks ⇒ use bash builtins')
    out.append('')
    for category in ['critical','performance','optimization','standards']:
      if self.issues[category]:
        out.append(f'{category.upper()}:')
        out.extend(f'  • {i}' for i in self.issues[category][:15])
        if len(self.issues[category])>15: out.append(f'  ... +{len(self.issues[category])-15} more')
        out.append('')
    return '\n'.join(out)

if __name__=='__main__':
  if len(sys.argv)<2: sys.exit('Usage: analyze.py <script.sh>')
  print(BashAnalyzer(sys.argv[1]).analyze())
