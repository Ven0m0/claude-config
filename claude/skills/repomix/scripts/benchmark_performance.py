import time
import subprocess
import os
from pathlib import Path

def measure_command(cmd, description):
    print(f"Measuring: {description}...")
    start_time = time.time()
    try:
        # Use shell=False for list of args
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60
        )
        duration = time.time() - start_time
        if result.returncode != 0:
            print(f"Command failed: {result.stderr}")
            return None
        return duration
    except Exception as e:
        print(f"Error running command: {e}")
        return None

def main():
    # Ensure repomix is installed
    try:
        subprocess.run(["repomix", "--version"], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Error: repomix not found. Please install it with 'npm install -g repomix'")
        return

    print("=== Repomix Performance Benchmark ===\n")

    # 1. Startup Overhead
    print("--- Startup Overhead (Version Check) ---")
    npx_version_time = measure_command(["npx", "repomix", "--version"], "npx repomix --version")
    direct_version_time = measure_command(["repomix", "--version"], "repomix --version")

    if npx_version_time and direct_version_time:
        print(f"npx time:    {npx_version_time:.4f}s")
        print(f"direct time: {direct_version_time:.4f}s")
        print(f"Startup saving: {npx_version_time - direct_version_time:.4f}s per call")

    print("\n--- Remote Repository Processing (octocat/Hello-World) ---")

    # Clean up previous outputs
    output_npx = Path("benchmark_npx.txt")
    output_direct = Path("benchmark_direct.txt")
    if output_npx.exists(): output_npx.unlink()
    if output_direct.exists(): output_direct.unlink()

    # Benchmark npx processing
    # Note: repomix_batch.py constructs cmd as: ["npx", "repomix", "--remote", repo_path, ...]
    npx_cmd = ["npx", "repomix", "--remote", "octocat/Hello-World", "--style", "plain", "-o", str(output_npx)]
    npx_process_time = measure_command(npx_cmd, "npx repomix --remote ...")

    # Benchmark direct processing
    direct_cmd = ["repomix", "--remote", "octocat/Hello-World", "--style", "plain", "-o", str(output_direct)]
    direct_process_time = measure_command(direct_cmd, "repomix --remote ...")

    if npx_process_time and direct_process_time:
        print(f"npx processing time:    {npx_process_time:.4f}s")
        print(f"direct processing time: {direct_process_time:.4f}s")
        diff = npx_process_time - direct_process_time
        improvement = (diff / npx_process_time) * 100
        print(f"Total time saving: {diff:.4f}s")
        print(f"Improvement: {improvement:.1f}%")

    # Cleanup
    if output_npx.exists(): output_npx.unlink()
    if output_direct.exists(): output_direct.unlink()

if __name__ == "__main__":
    main()
