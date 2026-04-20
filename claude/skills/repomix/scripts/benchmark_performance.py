import subprocess
import time
from pathlib import Path


def measure_command(cmd, description):
    start_time = time.perf_counter()
    try:
        # Use shell=False for list of args
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        duration = time.perf_counter() - start_time
        if result.returncode != 0:
            return None
        return duration
    except Exception:
        return None


def main() -> None:
    # Ensure repomix is installed
    try:
        subprocess.run(["repomix", "--version"], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Error: repomix is not installed or not in PATH.")
        return

    # 1. Startup Overhead
    print("Benchmarking startup overhead...")
    npx_version_time = measure_command(
        ["npx", "repomix", "--version"], "npx repomix --version"
    )
    direct_version_time = measure_command(["repomix", "--version"], "repomix --version")

    if npx_version_time and direct_version_time:
        print(f"npx repomix --version: {npx_version_time:.4f}s")
        print(f"repomix --version: {direct_version_time:.4f}s")
        overhead = npx_version_time - direct_version_time
        print(f"npx overhead: {overhead:.4f}s ({(overhead / direct_version_time) * 100:.1f}%)")

    # Clean up previous outputs
    output_npx = Path("benchmark_npx.txt")
    output_direct = Path("benchmark_direct.txt")
    if output_npx.exists():
        output_npx.unlink()
    if output_direct.exists():
        output_direct.unlink()

    # Benchmark npx processing
    # Note: repomix_batch.py now constructs cmd as: ["repomix", "--remote", repo_path, ...] without the npx wrapper
    npx_cmd = [
        "npx",
        "repomix",
        "--remote",
        "octocat/Hello-World",
        "--style",
        "plain",
        "-o",
        str(output_npx),
    ]
    npx_process_time = measure_command(npx_cmd, "npx repomix --remote ...")

    # Benchmark direct processing
    print("\nBenchmarking repository processing...")
    direct_cmd = [
        "repomix",
        "--remote",
        "octocat/Hello-World",
        "--style",
        "plain",
        "-o",
        str(output_direct),
    ]
    direct_process_time = measure_command(direct_cmd, "repomix --remote ...")

    if npx_process_time and direct_process_time:
        print(f"npx repomix processing: {npx_process_time:.4f}s")
        print(f"repomix processing: {direct_process_time:.4f}s")
        diff = npx_process_time - direct_process_time
        percentage = (diff / npx_process_time) * 100
        print(f"Difference: {diff:.4f}s ({percentage:.1f}% slower with npx)")

    # Cleanup
    if output_npx.exists():
        output_npx.unlink()
    if output_direct.exists():
        output_direct.unlink()


if __name__ == "__main__":
    main()
