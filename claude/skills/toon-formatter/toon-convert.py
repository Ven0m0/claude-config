#!/usr/bin/env python3
"""TOON v2.0 Encoder - Spec-compliant JSON to TOON converter
Implements https://github.com/toon-format/spec
"""
import json,sys,argparse
from typing import Any,Optional

def needs_quote(v:Any,delim:str)->bool:
  """Check if value needs quoting per TOON spec §7"""
  if v is None or isinstance(v,(bool,int,float)):return False
  s=str(v)
  if not s:return True
  if s in('true','false','null'):return True
  if s[0]==' 'or s[-1]==' ':return True
  if s=='-'or(s.startswith('-')and len(s)>1):return True
  if any(c in s for c in(':','\"','\\','[',']','{','}','\n','\r','\t')):return True
  if delim in s:return True
  try:
    float(s)
    return True
  except:pass
  return False

def esc(s:str)->str:
  """Escape string per TOON spec §7 - only 5 valid escapes"""
  return s.replace('\\','\\\\').replace('\"','\\\"').replace('\n','\\n').replace('\r','\\r').replace('\t','\\t')

def fmt(v:Any,delim:str)->str:
  """Format value with proper quoting and type handling"""
  if v is None:return'null'
  if isinstance(v,bool):return'true'if v else'false'
  if isinstance(v,float):
    if v!=v or v==float('inf')or v==float('-inf'):return'null'
    if v==-0.0:return'0'
    s=str(v)
    if'e'in s.lower():s=f'{v:.17g}'
    return s
  if isinstance(v,int):return str(v)
  s=str(v)
  return f'"{esc(s)}"'if needs_quote(v,delim)else s

def uniform(arr:list)->tuple[bool,list]:
  """Check if array is tabular (uniform objects with primitive values)"""
  if not arr or not all(isinstance(x,dict)for x in arr):return False,[]
  if any(isinstance(v,(dict,list))for o in arr for v in o.values()):return False,[]
  keys=list(arr[0].keys())
  return all(set(o.keys())==set(keys)for o in arr),keys

def arr(a:list,d:int,s:int,delim:str)->str:
  """Encode array per TOON spec §9"""
  if not a:return'[0]:'
  n=len(a)
  # Primitive inline array
  if all(not isinstance(x,(dict,list))for x in a):
    return f'[{n}]: {delim.join(fmt(x,delim)for x in a)}'
  # Tabular array
  ok,keys=uniform(a)
  if ok:
    dm=''if delim==','else delim
    lines=[f'[{n}{dm}]{{{delim.join(keys)}}}:']
    for item in a:
      lines.append(' '*d+delim.join(fmt(item[k],delim)for k in keys))
    return'\n'.join(lines)
  # Mixed/list array
  lines=[f'[{n}]:']
  for item in a:
    if isinstance(item,dict):
      # Object as list item - spec §10
      flds=list(item.items())
      if flds:
        k0,v0=flds[0]
        k0s=fmt(k0,delim)
        # First field tabular array on hyphen line
        if isinstance(v0,list)and uniform(v0)[0]:
          arr_str=arr(v0,d+s*2,s,delim)
          lines.append(' '*d+'- '+k0s+': '+arr_str.split('\n')[0])
          for ln in arr_str.split('\n')[1:]:
            lines.append(' '*(d+s)+ln)
          for k,v in flds[1:]:
            lines.extend(kv(k,v,d+s,s,delim))
        else:
          # Regular list item
          for i,(k,v)in enumerate(flds):
            pref='- 'if i==0 else''
            lines.extend(kv(k,v,d if i==0 else d+s,s,delim,pref))
    elif isinstance(item,list):
      arr_str=arr(item,d+s,s,delim)
      lines.append(' '*d+'- '+arr_str)
    else:
      lines.append(' '*d+'- '+fmt(item,delim))
  return'\n'.join(lines)

def kv(k:Any,v:Any,d:int,s:int,delim:str,pref:str='')->list:
  """Encode key-value pair"""
  key=fmt(k,delim)
  out=[]
  if isinstance(v,dict):
    out.append(' '*d+pref+key+':')
    obj_str=obj(v,d+s,s,delim)
    if obj_str:out.append(obj_str)
  elif isinstance(v,list):
    arr_str=arr(v,d+s,s,delim)
    out.append(' '*d+pref+key+': '+arr_str.split('\n')[0])
    for ln in arr_str.split('\n')[1:]:
      out.append(ln)
  else:
    out.append(' '*d+pref+key+': '+fmt(v,delim))
  return out

def obj(o:dict,d:int,s:int,delim:str)->str:
  """Encode object per TOON spec §8"""
  if not o:return''
  lines=[]
  for k,v in o.items():
    lines.extend(kv(k,v,d,s,delim))
  return'\n'.join(lines)

def enc(data:Any,spc:int=2,delim:str=',')->str:
  """Main encoder - handles all root forms"""
  if isinstance(data,dict):return obj(data,0,spc,delim)
  if isinstance(data,list):return arr(data,0,spc,delim)
  return fmt(data,delim)

def main():
  p=argparse.ArgumentParser(description='TOON v2.0 Encoder (spec-compliant)')
  p.add_argument('input',nargs='?',help='JSON file (stdin if omitted)')
  p.add_argument('-o','--output',help='Output file (stdout if omitted)')
  p.add_argument('-d','--delimiter',choices=['comma','tab','pipe'],default='comma')
  p.add_argument('-i','--indent',type=int,default=2,help='Spaces per indent (default: 2)')
  a=p.parse_args()
  delim={'comma':',','tab':'\t','pipe':'|'}[a.delimiter]
  data=json.load(open(a.input)if a.input else sys.stdin)
  result=enc(data,a.indent,delim)
  out=open(a.output,'w')if a.output else sys.stdout
  out.write(result)
  if result and not result.endswith('\n'):out.write('\n')
  if a.output:out.close()

if __name__=='__main__':
  main()
