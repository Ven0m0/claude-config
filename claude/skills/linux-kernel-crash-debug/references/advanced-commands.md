# Advanced Commands Reference

Detailed advanced command usage, loaded on demand.

## list - Linked List Traversal

Traverse kernel linked lists, automatically following next/prev pointers:

```
# Basic syntax
list <struct.member> <start_addr>
list -h <start_addr>    # start is a data structure containing embedded list_head
list -H <start_addr>    # start is a standalone LIST_HEAD() address

# Common options
-o offset     # offset of next pointer within structure
-s struct     # format and display structure contents
-S struct     # read member values directly from memory
-r            # reverse traversal (using prev pointer)
-B            # use Brent's algorithm to detect circular lists
-e end        # specify end address

# Examples
# Traverse task hierarchy
crash> list task_struct.p_pptr c169a000

# Traverse file system types
crash> list file_system_type.next -s file_system_type.name,fs_flags c03adc90

# Traverse run queue
crash> list task_struct.run_list -H runqueue_head

# Traverse all task PIDs
crash> list task_struct.tasks -s task_struct.pid -h ffff88012b98e040

# Traverse dentry subdirectories
crash> list -o dentry.d_child -s dentry.d_name.name -O dentry.d_subdirs -h <parent_dentry>

# Detect circular lists
crash> list -B -h <start_addr>
```

## rd - Memory Read

Read and display memory contents:

```
# Basic syntax
rd [options] <address|symbol> [count]

# Address type options
-p      # physical address
-u      # user virtual address
-m      # Xen host machine address
-f      # dumpfile offset

# Output format options
-d      # signed decimal
-D      # unsigned decimal
-x      # suppress ASCII translation
-s      # symbolic display
-S      # show slab cache name
-N      # network byte order
-R      # reverse display
-a      # ASCII character display

# Data size options
-8      # 8-bit
-16     # 16-bit
-32     # 32-bit (default)
-64     # 64-bit

# Range options
-e addr     # display up to specified address
-o offs     # offset from start address
-r file     # output raw data to file

# Examples
crash> rd -a linux_banner       # ASCII display of kernel version string
crash> rd -s f6e31f70 28        # symbolic display of 28 words
crash> rd -S f6e31f70 28        # show slab cache names
crash> rd -SS f6e31f70 28       # double slab display
crash> rd -d jiffies            # decimal display
crash> rd -64 kernel_version    # 64-bit display
crash> rd c009bf2c -e c009bf60  # range display
crash> rd -p 1000 10            # read from physical address
crash> rd -u 80b4000 20         # read from user space
```

## search - Memory Search

Search for specific values in memory:

```
# Basic syntax
search [options] <value>

# Search scope options
-s start    # start address
-e end      # end address
-l length   # search length
-k          # kernel virtual address space
-K          # kernel space (excluding vmalloc)
-V          # kernel space (excluding unity-mapped)
-u          # user virtual address space
-p          # physical address space
-t          # all task kernel stacks
-T          # active task kernel stacks

# Search type options
-c          # search for string
-w          # search for 32-bit integer
-h          # search for 16-bit short

# Other options
-m mask     # ignore masked bits
-x count    # display memory context around found values

# Examples
# Search for 0xdeadbeef in user space
crash> search -u deadbeef

# Search with mask
crash> search -s _etext -m ffff0000 abcd

# Search 4KB page
crash> search -s c532c000 -l 4096 ffffffff

# Search physical memory
crash> search -p babe0000 -m ffff

# Search for strings
crash> search -k -c "can't allocate memory"
crash> search -k -c "Failure to"

# Search all task stacks
crash> search -t ffff81002c0a3050

# Display context
crash> search -x 5 -k deadbeef
```

## vtop - Virtual Address Translation

Convert virtual addresses to physical addresses, showing page table walk:

```
# Basic syntax
vtop [-c [pid|taskp]] [-u|-k] <address>

# Options
-u          # user virtual address
-k          # kernel virtual address
-c pid      # use page table of specified process
-c taskp    # use page table of specified task address

# Examples
# Translate user space address
crash> vtop 80b4000

# Translate kernel space address
crash> vtop c806e000

# Use page table of specified process
crash> vtop -c 1359 c806e000

# Output structure example
VIRTUAL   PHYSICAL
7f09cd705000 2322db000
PGD: 235d707f0 => 800000023489f067
PUD: 23489f138 => 234727067
PMD: 234727358 => 35eba067
PTE: 35eba828

# Page flag interpretation
(PRESENT|RW|USER|ACCESSED|DIRTY)

# Swap information (if page is swapped out)
SWAP: /dev/sda8  OFFSET: 22716
```

### Page Table Hierarchy

x86_64 four-level page table:
- **PGD** (Page Global Directory): Page Global Directory
- **PUD** (Page Upper Directory): Page Upper Directory
- **PMD** (Page Middle Directory): Page Middle Directory
- **PTE** (Page Table Entry): Page Table Entry

## kmem - Memory Subsystem Analysis

In-depth analysis of kernel memory state:

```
# Memory usage overview
crash> kmem -i              # display memory usage information

# Page related
crash> kmem -p              # display all page structures
crash> kmem -p <addr>       # display page info for specific address
crash> kmem -P <phys_addr>  # physical address parameter
crash> kmem -m <fields>     # display specified page fields
crash> kmem -g              # display page flags enum values

# Slab allocator
crash> kmem -s              # display basic kmalloc slab data
crash> kmem -S              # display detailed slab data (including all objects)
crash> kmem -S <cache>      # display specified slab cache
crash> kmem -r              # display root slab cache accumulation data
crash> kmem -I <cache>      # ignore specified slab cache

# Memory zones
crash> kmem -z              # display per-zone memory statistics
crash> kmem -n              # display memory node/section/block

# vmalloc
crash> kmem -v              # display vmalloc allocated regions

# Free memory
crash> kmem -f              # display free memory headers
crash> kmem -F              # same as -f, with linked pages

# Other
crash> kmem -c              # verify page_hash_table
crash> kmem -V              # display vm_stat table
crash> kmem -o              # display CPU offset values
crash> kmem -h              # display hugepage information

# Find address ownership
crash> kmem <addr>          # find which slab/page an address belongs to
```

## foreach - Batch Task Operations

Execute the same command on a set of tasks:

```
# Basic syntax
foreach [pid|taskp|name|state] <command> [flags]

# Process state filtering
RU  - Running
IN  - Interruptible
UN  - Uninterruptible
ST  - Stopped
ZO  - Zombie
TR  - Traced
SW  - Swapping
DE  - Dead
WA  - Wakekill
PA  - Parked
ID  - Idle
NE  - New

# Special filtering
kernel      # kernel threads
user        # user processes
gleader     # thread group leaders
active      # active tasks

# Supported commands and their flags
bt:     -r -t -l -e -R -f -F -o -s -x -d
vm:     -p -v -m -R -d -x
task:   -R -d -x
files:  -c -R
net:    -s -S -R -d -x
ps:     -G -s -p -c -t -l -a -g -r -y
sig:    -g
vtop:   -c -u -k
set:    (no flags)

# Examples
crash> foreach bt              # all process call stacks
crash> foreach bash task       # task_struct for all bash processes
crash> foreach files           # open files for all processes
crash> foreach UN bt           # call stacks for all uninterruptible processes
crash> foreach kernel bt       # call stacks for all kernel threads
crash> foreach user ps         # all user processes
crash> foreach 'event.*' task -R state  # regex match process names
```

## bt - Advanced Options

Advanced usage of stack backtrace:

```
# CPU related
-a              # active tasks on all CPUs
-c cpu          # specified CPU (comma-separated for multiple)

# Stack frame expansion
-f              # expand raw data for each stack frame
-F              # symbolic display of stack frame data

# Symbol information
-l              # display source file and line number
-s              # display symbol name and offset
-x              # hexadecimal offset (with -s)
-d              # decimal offset (with -s)

# Stack analysis
-t              # display all text symbols in stack
-T              # start from above task_struct
-e              # search for exception frames in stack
-v              # check for stack overflow

# Filtering
-R symbol       # only show stacks referencing this symbol
-n idle         # filter idle tasks
-g              # display all threads in thread group

# Custom start point
-I ip           # specify starting instruction pointer
-S sp           # specify starting stack pointer

# Compatibility
-o              # use legacy backtrace method
-O              # default to legacy method

# Examples
crash> bt -a                   # active tasks on all CPUs
crash> bt -c 0,2               # CPUs 0 and 2
crash> bt -f 1592              # expand stack frames for process 1592
crash> bt -F -l                # symbolic + source line number
crash> bt -sx                  # symbol name + hexadecimal offset
crash> bt -e                   # search for exception frames
crash> bt -v                   # check for stack overflow
crash> bt -R spin_lock         # only stacks containing spin_lock
crash> bt -I ffffffff81000000 -S ffff880000000000  # custom start point
```

## GDB Passthrough Mode

Directly use GDB commands:

```
# Single invocation
crash> gdb help
crash> gdb bt
crash> gdb info registers
crash> gdb x/20i $rip

# Persistent gdb mode
crash> set gdb on
(gdb) bt
(gdb) info threads
(gdb) frame 3
(gdb) print *current
(gdb) set gdb off

# Call crash commands in gdb mode
(gdb) crash bt
(gdb) crash ps

# Common gdb commands
(gdb) info registers       # register information
(gdb) info threads         # thread information
(gdb) frame N              # switch stack frame
(gdb) up/down              # move up/down stack frames
(gdb) print <expr>         # print expression
(gdb) x/NFU <addr>         # examine memory
(gdb) disassemble          # disassemble
(gdb) list                 # source code listing
```