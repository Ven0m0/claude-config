# vmcore File Format

Detailed kernel dump file format reference.

## ELF Format Basics

vmcore typically uses ELF (Executable and Linkable Format):

```bash
# Check vmcore type
file vmcore
# Output: ELF 64-bit LSB core file, x86-64, version 1 (SYSV), SVR4-style

# View ELF header
readelf -h vmcore

# View Program Headers (describe memory segments)
readelf -l vmcore

# View Section Headers
readelf -S vmcore

# View Note Sections
readelf -n vmcore

# Use objdump to view
objdump -p vmcore     # Program Headers
objdump -x vmcore     # All header information
```

### ELF Core Dump Structure

```
+------------------+
|   ELF Header     |  <- File type: ET_CORE
+------------------+
| Program Headers  |  <- Describe memory segments
+------------------+
|  Note Sections   |  <- VMCOREINFO, registers, etc.
+------------------+
|   Memory Segments|  <- Actual memory contents
+------------------+
```

## VMCOREINFO

VMCOREINFO is a special ELF note section containing critical kernel information:

```
# View in crash
crash> sys -i

# View with readelf
readelf -n vmcore | grep -A 100 VMCOREINFO

# Extract and parse
crash> p *vmcoreinfo_data
```

### Key Fields

| Field | Description |
|-------|-------------|
| `OSRELEASE` | Kernel version string |
| `PAGESIZE` | Page size |
| `init_uts_ns.name.release` | Kernel version |
| `phys_base` | Physical address base (x86_64) |
| `VA_BITS` | Virtual address bits (ARM64) |
| `KERNELOFFSET` | Kernel offset (KASLR) |
| `CRASHTIME` | Crash timestamp |

### Structure Information

VMCOREINFO contains sizes and member offsets of key structures:

```
SIZE(page)=64
OFFSET(page.flags)=0
OFFSET(page._refcount)=8
OFFSET(page.mapping)=24

SIZE(pglist_data)=...
SIZE(zone)=...
SIZE(free_area)=...
SIZE(list_head)=16
```

### Symbol Addresses

```
init_uts_ns=ffffffff8283a040
node_online_map=ffffffff8283e000
swapper_pg_dir=ffffffff82800000
init_task=ffffffff82812480
```

## Supported Dump Formats

### 1. ELF Core Dump

Standard ELF format, most universal:

```bash
# Features
- Can be read directly by gdb
- Contains complete memory layout information
- Supports compression (ELF with gzip/xz)

# Generation method
kdump (default configuration)
makedumpfile -E vmcore vmcore.elf
```

### 2. kdump Compressed

Compressed format, saves space:

```bash
# Features
- Default compression format
- Requires crash or makedumpfile to parse
- Supports filtering and compression levels

# Generation method
kdump (compression configuration)
makedumpfile -c -d 31 vmcore vmcore.kdump

# Decompress to ELF
makedumpfile -E vmcore.kdump vmcore.elf
```

### 3. diskdump

Red Hat diskdump format:

```bash
# Features
- Red Hat historical format
- Supports compression
- Requires specific kernel patches

# Identification
crash> sys
DUMPFILE: diskdump
```

### 4. netdump

Red Hat netdump format:

```bash
# Features
- Dump transfer via network
- Used for remote crash collection
- Requires netdump server

# Identification
crash> sys
DUMPFILE: netdump
```

### 5. LKCD

Linux Kernel Crash Dump:

```bash
# Features
- Early Linux dump mechanism
- Segmented storage
- Rarely used now
```

### 6. Raw RAM Dump

Raw memory dump:

```bash
# Startup method
crash vmlinux ddr.bin --ram_start=0x80000000

# Multiple memory regions
crash vmlinux ddr1.bin@0x80000000 ddr2.bin@0x880000000

# Features
- No ELF header
- Requires specifying physical start address
- Common in embedded systems
```

## kdump Working Principle

### Normal Kernel vs Capture Kernel

```
+-------------------+     +-------------------+
|   Normal Kernel   |     |  Capture Kernel   |
|   (Production)    |     |   (kdump kernel)  |
+-------------------+     +-------------------+
        |                         |
        | crash/panic             |
        |------------------------>|
        |   kexec fast reboot     |
        |                         |
        |                   generate vmcore
        |                         |
        v                         v
```

### Memory Reservation

```bash
# View kdump reserved memory
cat /sys/kernel/kexec_crash_size

# GRUB configuration
crashkernel=128M@16M      # Fixed location
crashkernel=auto          # Auto calculation
crashkernel=256M,high     # High memory
```

### Dump Process

```
1. Kernel panic
2. kexec quickly starts capture kernel
3. Capture kernel runs
4. Read memory via /proc/vmcore
5. makedumpfile processes and saves
6. Reboot system
```

## makedumpfile Tool

Process and compress vmcore:

```bash
# Basic usage
makedumpfile vmcore vmcore.filtered

# Compression
makedumpfile -c vmcore vmcore.compressed   # zlib
makedumpfile -l vmcore vmcore.compressed   # lzo
makedumpfile -p vmcore vmcore.compressed   # snappy

# Filtering (-d levels)
# 1: Exclude zero pages
# 2: Exclude cache pages
# 4: Exclude cache private pages
# 8: Exclude user data pages
# 16: Exclude free pages
makedumpfile -d 31 -c vmcore vmcore.small  # Minimize

# Convert to ELF
makedumpfile -E vmcore vmcore.elf

# View information
makedumpfile -f vmcore

# Split large files
makedumpfile --split vmcore part1 part2 part3

# Reassemble split files
makedumpfile --reassemble part1 part2 part3 vmcore
```

## vmcore Analysis Tips

### Check vmcore Integrity

```bash
# Use file command
file vmcore

# Use crash to test load
crash --osrelease vmcore

# Check VMCOREINFO
readelf -n vmcore | grep VMCOREINFO
```

### Find Matching vmlinux

```bash
# Extract kernel version from vmcore
strings vmcore | grep "Linux version"
readelf -n vmcore | grep OSRELEASE

# Or in crash
crash --osrelease vmcore
```

### Handle Corrupted vmcore

```bash
# Skip error checking
crash --no_kallsyms vmlinux vmcore

# Use minimal loading
crash --minimal vmlinux vmcore
```

### Rebuild from Partial Memory

```bash
# Multiple memory regions
crash vmlinux mem1.bin@0x0 mem2.bin@0x100000000

# Use System.map instead of partial symbols
crash -S System.map vmlinux vmcore
```

## Debugging Information

### View vmcore Details

```
crash> sys
crash> sys -i           # VMCOREINFO
crash> sys -t           # panic time
crash> sys -n           # NMI information
```

### Memory Layout

```
crash> kmem -v          # vmalloc region
crash> kmem -n          # memory node information
crash> vtop <addr>      # address translation
```

### CPU State

```
crash> bt -a            # all CPU call stacks
crash> mach             # machine information
crash> set -c <cpu>     # switch CPU context
```