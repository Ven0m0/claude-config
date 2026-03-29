# Debugging Case Studies

Detailed kernel crash debugging case analysis.

## Case 1: Kernel BUG Location

### Symptoms

```
PANIC: "kernel BUG at pipe.c:120!"
```

### Analysis Steps

```
# 1. Confirm system information
crash> sys
KERNEL: vmlinux
DUMPFILE: vmcore
CPUS: 8
DATE: Mon Jan 15 10:30:45 2024
UPTIME: 00:15:32
LOAD AVERAGE: 0.50, 0.35, 0.20
TASKS: 156
NODENAME: server01
RELEASE: 4.18.0-348.el8.x86_64
VERSION: #1 SMP Mon Jan 1 00:00:00 UTC 2024
MACHINE: x86_64  (2900 Mhz)
MEMORY: 32 GB
PANIC: "kernel BUG at pipe.c:120!"

# 2. View kernel log
crash> log | tail -100
[...]
kernel BUG at fs/pipe.c:120!
invalid opcode: 0000 [#1] SMP PTI
CPU: 3 PID: 1234 Comm: worker Tainted: G           O      4.18.0-348.el8.x86_64
RIP: 0010:pipe_read+0x120/0x300
[...]

# 3. Analyze call stack
crash> bt
PID: 1234   TASK: ffff88012b98e040  CPU: 3   COMMAND: "worker"
#0 [ffffc90000123e00] __die at ffffffff8105a2b0
#1 [ffffc90000123e30] do_trap at ffffffff8105a1a0
#2 [ffffc90000123e80] invalid_op at ffffffff81c00bf4
#3 [ffffc90000123f00] pipe_read at ffffffff81234560
#4 [ffffc90000123f80] do_readv at ffffffff81210000
#5 [ffffc90000123fc0] sys_readv at ffffffff81210100

# 4. Expand stack frames to get parameters
crash> bt -f
#3 [ffffc90000123f00] pipe_read at ffffffff81234560
    ffff88012b98e040:  ffff880123456000   # file pointer
    ffff88012b98e080:  ffff880123457000   # buffer
    ffff88012b98e0c0:  0000000000001000   # count
    [...]

# 5. Chain trace data structures
crash> struct file.f_dentry ffff880123456000
  f_dentry = ffff880123458000

crash> struct dentry.d_inode ffff880123458000
  d_inode = ffff880123459000

crash> struct inode.i_pipe ffff880123459000
  i_pipe = ffff88012345a000

crash> struct pipe_inode_info ffff88012345a000
struct pipe_inode_info {
  mutex = {
    owner = 0,
    count = 2,        # Anomaly! Should be <= 1
    wait_list = {...}
  },
  readers = 1,
  writers = 1,
  [...]
}

# 6. Batch check all pipe inodes
crash> kmem -S pipe_inode_cache | head
CACHE    NAME                OBJSIZE  ALLOCATED  TOTAL  SLABS  SSIZE
ffff88012a000000  pipe_inode_cache      184       45      60     3    4k

# Find mutexes with abnormal counts
crash> foreach bt | grep -B10 "pipe_read"
```

### Root Cause Analysis

`pipe_inode_info.mutex.count = 2` indicates semaphore count anomaly, possibly:
- Double free
- Race condition
- Use after free

---

## Case 2: Deadlock Analysis

### Symptoms

System hangs, unresponsive, but heartbeat normal.

### Analysis Steps

```
# 1. View all CPU states
crash> bt -a
CPU 0:
#0 [ffff880000000000] schedule at ffffffff81a12345
#1 [ffff880000000100] schedule_timeout at ffffffff81a13456
#2 [ffff880000000180] wait_for_completion at ffffffff81a14567
PID: 100   TASK: ffff88012a000000  CPU: 0   COMMAND: "thread_A"

CPU 1:
#0 [ffff880000010000] schedule at ffffffff81a12345
#1 [ffff880000010100] schedule_timeout at ffffffff81a13456
#2 [ffff880000010180] __down at ffffffff81a15678
PID: 101   TASK: ffff88012a001000  CPU: 1   COMMAND: "thread_B"

# 2. View uninterruptible processes
crash> ps -m | grep UN
  100  UN   0.0   0  ffff88012a000000  thread_A
  101  UN   0.1   0  ffff88012a001000  thread_B

# 3. Analyze wait queues
crash> foreach UN bt
PID: 100   TASK: ffff88012a000000  CPU: 0   COMMAND: "thread_A"
#0 schedule
#1 schedule_timeout
#2 wait_for_completion
#3 some_function_A

PID: 101   TASK: ffff88012a001000  CPU: 1   COMMAND: "thread_B"
#0 schedule
#1 __down
#2 down
#3 some_function_B

# 4. Check lock ownership
crash> struct mutex ffff88012b000000
struct mutex {
  owner = 0xffff88012a000000,  # thread_A holds
  wait_lock = {...},
  count = 0,
  wait_list = {
    next = 0xffff88012b000020,
    prev = 0xffff88012b000020
  }
}

# 5. Trace what thread_A is waiting for
crash> bt -f 100
#2 wait_for_completion
    completion = 0xffff88012b001000
crash> struct completion ffff88012b001000
struct completion {
  done = 0,
  wait = {...}
}

# 6. Who should complete this completion?
crash> search -k ffff88012b001000
ffff88012a002000: ffff88012b001000  # In thread_B's stack
```

### Root Cause Analysis

- thread_A holds mutex, waiting for completion
- thread_B is waiting for the same mutex
- thread_B should complete the completion but is blocked

**Deadlock Pattern**: ABBA deadlock

---

## Case 3: Memory Exhaustion (OOM)

### Symptoms

```
Out of memory: Kill process 1234 (java) score 500 or sacrifice child
```

### Analysis Steps

```
# 1. View memory statistics
crash> kmem -i
                 PAGES        TOTAL      PERCENTAGE
TOTAL MEM       8388608      32 GB         ----
FREE            104857       400 MB         1%
USED            8283751     31.6 GB        98%
SHARED           524288       2 GB         6%
BUFFERS          262144       1 GB         3%
CACHED          1572864       6 GB        18%

# 2. View memory zones
crash> kmem -z
ZONE  DMA:
  pages_free     = 4096
  pages_min      = 128
ZONE  DMA32:
  pages_free     = 65536
ZONE  NORMAL:
  pages_free     = 32768
ZONE  MOVABLE:
  pages_free     = 0

# 3. View slab usage
crash> kmem -s | sort -k 4 -rn | head
CACHE            NAME              OBJSIZE  ALLOCATED  TOTAL
ffff88012a000000 kmalloc-8192       8192    524288    600000
ffff88012a001000 kmalloc-4096       4096    262144    300000
ffff88012a002000 dentry              192    131072    150000
ffff88012a003000 inode_cache         592     65536     80000

# 4. View process memory usage
crash> ps -G | sort -k 5 -rn | head
PID    PPID  CPU   TASK        ST  %MEM   VSZ      RSS   COMM
1234   1     3   ffff88012a003000  IN  25.0  8GB    8GB   java
5678   1     2   ffff88012a004000  IN  15.0  5GB    5GB   python
9012   1     1   ffff88012a005000  IN  10.0  3GB    3GB   node

# 5. Detailed view of large process
crash> vm 1234
PID: 1234   TASK: ffff88012a003000  CPU: 3   COMMAND: "java"
MM               PGD          RSS    TOTAL_VM
ffff88012b000000 ffff88012b001000  8GB    8GB

VMA           START          END     FLAGS FILE
ffff88012c000000 7f0000000000 7f0000800000 877b3b [heap]
ffff88012c001000 7f0000800000 7f0001000000 877b3b [heap]
...

# 6. View OOM killer records
crash> log | grep -A 50 "Out of memory"
```

### Root Cause Analysis

- Memory usage 98%
- java process uses 25% memory
- NORMAL zone nearly exhausted
- Possible memory leak

---

## Case 4: NULL Pointer Dereference

### Symptoms

```
BUG: unable to handle kernel NULL pointer dereference at 0000000000000010
```

### Analysis Steps

```
# 1. View panic information
crash> sys
PANIC: "BUG: unable to handle kernel NULL pointer dereference at 0000000000000010"

# 2. View call stack
crash> bt
#0 __die at ffffffff8105a2b0
#1 exc_page_fault at ffffffff8105b3c0
#2 asm_exc_page_fault at ffffffff81c00bf4
#3 my_driver_ioctl at ffffffff81234560
#4 sys_ioctl at ffffffff81210000

# 3. Disassemble problematic function
crash> dis my_driver_ioctl
0xffffffff81234500 <my_driver_ioctl>:   push   rbp
0xffffffff81234501 <my_driver_ioctl+1>: mov    rbp,rsp
...
0xffffffff81234550 <my_driver_ioctl+80>: mov    rax,QWORD PTR [rdi+0x10]  # Crash point
...

# 4. Expand stack frame to see parameters
crash> bt -f
#3 my_driver_ioctl at ffffffff81234550
    rdi = 0x0000000000000000   # NULL!
    rsi = 0x000000000000abcd

# 5. Confirm structure offset
crash> struct -o my_device
struct my_device {
    [0x0] void *priv;
    [0x8] int state;
    [0x10] struct device *dev;   # +0x10 is the crash offset
}

# 6. Trace where NULL came from
crash> bt -l
#3 my_driver_ioctl at /home/user/my_driver.c:123
crash> list my_driver.devices -s my_driver.device -h my_driver_head
```

### Root Cause Analysis

- First parameter `rdi` of `my_driver_ioctl` is NULL
- Attempting to access `rdi + 0x10` causes page fault
- Need to add NULL check in code

---

## Case 5: Stack Overflow

### Symptoms

```
kernel stack overflow (double-fault)
```

### Analysis Steps

```
# 1. Check stack overflow
crash> bt -v
PID: 1234   COMMAND: "worker"   STACK OVERFLOW DETECTED
    stack pointer: ffffc90000123fc0
    stack base:    ffffc90000120000
    stack limit:   ffffc90000124000
    overflow by:   16 bytes

# 2. View call stack depth
crash> bt
#0 recursive_function at ffffffff81234560
#1 recursive_function at ffffffff81234580
#2 recursive_function at ffffffff81234580
...(repeated hundreds of times)
#500 recursive_function at ffffffff81234580

# 3. View stack usage
crash> bt -r | wc -l
8192    # 8KB stack is full

# 4. Check large structures
crash> struct large_context
struct large_context {
    char buffer[4096];
    int data[1024];
    ...
}
SIZE: 8200  # Structure itself exceeds stack size!

# 5. Check other task stack status
crash> foreach bt -v
```

### Root Cause Analysis

- Too deep recursion
- Or allocating large structures on stack
- Need to change to dynamic allocation or reduce recursion depth