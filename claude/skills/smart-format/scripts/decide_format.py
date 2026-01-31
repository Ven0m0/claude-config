#!/usr/bin/env python3
import os
import sys
import subprocess
import json
import shutil
from pathlib import Path
from typing import Dict, Any

# Threshold: If savings < 5%, prefer TOON for readability
READABILITY_BIAS = 0.05 

def get_file_size(path: str) -> int:
    return os.path.getsize(path)

def benchmark_format(file_path: str) -> Dict[str, Any]:
    """Runs available formatters and returns size comparison."""
    original_size = get_file_size(file_path)
    results = {"original": original_size}
    temp_base = f"/tmp/{Path(file_path).stem}"

    # 1. Test TOON (Readability King)
    if shutil.which("tooner"):
        try:
            subprocess.run(f"tooner -i '{file_path}' -o '{temp_base}.toon'", shell=True, check=True, stderr=subprocess.DEVNULL)
            results["toon"] = get_file_size(f"{temp_base}.toon")
        except: pass

    # 2. Test ZON (Efficiency King)
    if shutil.which("zon"):
        try:
            # Assuming 'zon encode' syntax based on your notes
            subprocess.run(f"zon encode '{file_path}' > '{temp_base}.zon'", shell=True, check=True, stderr=subprocess.DEVNULL)
            results["zon"] = get_file_size(f"{temp_base}.zon")
        except: pass

    # 3. Test PLOON (Deep Nesting King)
    if shutil.which("ploon"):
        try:
            subprocess.run(f"ploon stringify '{file_path}' > '{temp_base}.pln'", shell=True, check=True, stderr=subprocess.DEVNULL)
            results["ploon"] = get_file_size(f"{temp_base}.pln")
        except: pass

    # Logic: Determine Winner
    best_fmt = "original"
    min_size = original_size

    for fmt, size in results.items():
        if fmt == "original": continue
        # Apply bias: TOON beats ZON/PLOON if sizes are roughly equal
        adjusted_size = size * (0.95 if fmt == "toon" else 1.0)
        
        if adjusted_size < min_size:
            min_size = size  # use actual size for reporting
            best_fmt = fmt

    savings = (1 - (min_size / original_size)) * 100 if original_size > 0 else 0
    return {
        "file": file_path,
        "best_format": best_fmt,
        "savings_pct": round(savings, 2),
        "sizes": results
    }

def main():
    target_dir = sys.argv[1] if len(sys.argv) > 1 else "."
    report = []
    
    print(f"Scanning {target_dir} for JSON/YAML to optimize...")
    
    for root, _, files in os.walk(target_dir):
        for f in files:
            if f.endswith((".json", ".yaml", ".yml")):
                full_path = os.path.join(root, f)
                res = benchmark_format(full_path)
                report.append(res)
                
                # Immediate Feedback
                icon = "⚡" if res["savings_pct"] > 30 else "📉"
                print(f"{icon} {f}: Best={res['best_format'].upper()} (-{res['savings_pct']}%)")

    # Generate Action Plan
    with open("format_optimization_plan.json", "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"\nAnalysis Complete. Action plan saved to format_optimization_plan.json")

if __name__ == "__main__":
    main()
