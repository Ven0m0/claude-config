---
name: reverse-engineering-protocols
description: Reverse engineers network protocols through packet analysis, dissection, and documentation. Use when analyzing network traffic, understanding proprietary protocols, or debugging communication. Triggers include "pcap", "packet capture", "protocol analysis", "Wireshark", or "tcpdump".
---

# Protocol Reverse Engineering

Comprehensive techniques for capturing, analyzing, and documenting network protocols.

## Quick Reference (30 seconds)

### Workflow
1. **Capture** traffic with tcpdump/Wireshark → export clean pcap
2. **Identify** protocol boundaries, message types, state transitions
3. **Document** message formats, fields, validation rules

### Essential Commands
```bash
# Capture
tcpdump -i eth0 -w capture.pcap
tshark -i eth0 -w capture.pcap

# Analysis
tshark -r capture.pcap -T fields -e ip.src -e ip.dst -e tcp.port

# MITM
mitmproxy --mode transparent -p 8080
```

### Wireshark Filters
```
tcp.port == 8080
http.request.method == "POST"
frame contains "password"
tcp.flags.syn == 1 && tcp.flags.ack == 0
```

---

## Implementation Guide (5 minutes)

### Traffic Capture

**tcpdump:**
```bash
tcpdump -i eth0 port 8080 -w capture.pcap  # With filter
tcpdump -i eth0 -s 0 -w capture.pcap       # Full packet
tcpdump -i eth0 -X port 80                 # Real-time display
```

**Wireshark:**
```bash
tshark -i eth0 -b filesize:100000 -b files:10 -w capture.pcap  # Ring buffer
```

**MITM:**
```bash
mitmproxy --mode transparent --ssl-insecure  # SSL intercept
mitmdump -w traffic.mitm                      # Dump to file
```

### Protocol Analysis

**Wireshark techniques:**
- Follow streams: Right-click → Follow → TCP/HTTP Stream
- Export objects: File → Export Objects → HTTP
- TLS decryption: Edit → Preferences → Protocols → TLS

**tshark extraction:**
```bash
tshark -r file.pcap -Y "http" -T fields -e http.host -e http.request.uri
tshark -r file.pcap -q -z "conv,tcp"         # Conversation stats
tshark -r file.pcap -q -z "http,tree"        # HTTP hierarchy
```

### Message Format Identification

Common patterns:
| Structure | Description |
|-----------|-------------|
| Magic bytes | Fixed signature at start (e.g., `0x89PNG`) |
| Length prefix | Size field before payload |
| TLV | Type-Length-Value encoding |
| Delimiter | Separators (CRLF, null byte) |

**Binary header template:**
```
struct Packet {
    uint8_t  magic[4];    // "ABCD" signature
    uint32_t version;
    uint32_t payload_len;
    uint32_t checksum;
    uint8_t  payload[];
};
```

---

## Advanced Patterns

### Python Protocol Parser
```python
import struct
from dataclasses import dataclass

@dataclass
class MessageHeader:
    magic: bytes; version: int; msg_type: int; length: int
    
    @classmethod
    def from_bytes(cls, data: bytes):
        magic, version, msg_type, length = struct.unpack(">4sHHI", data[:12])
        return cls(magic, version, msg_type, length)
```

### Entropy Analysis
```python
import math
from collections import Counter

def entropy(data: bytes) -> float:
    if not data: return 0.0
    counter = Counter(data)
    probs = [count / len(data) for count in counter.values()]
    return -sum(p * math.log2(p) for p in probs)

# < 6.0: Plaintext/structured | 6.0-7.5: Compressed | > 7.5: Encrypted
```

### Common Encryption Indicators
- High entropy (>7.5)
- No readable strings
- Uniform byte distribution
- No repeating patterns

### State Machine Documentation
```
[IDLE] --connect--> [HANDSHAKE] --auth--> [AUTHENTICATED]
                                 --fail--> [DISCONNECTED]
[AUTHENTICATED] --request--> [PROCESSING] --response--> [AUTHENTICATED]
```

---

## Documentation Template

```markdown
# Protocol: [Name]
Version: [X.Y] | Port: [XXXX] | Transport: [TCP/UDP]

## Message Types
| ID | Name | Direction | Description |
|----|------|-----------|-------------|
| 0x01 | HELLO | C→S | Initial handshake |

## Message Format: HELLO
| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 0 | 4 | uint32 | magic | 0x48454C4F |
| 4 | 2 | uint16 | version | Protocol version |

## State Machine
INIT → HELLO → AUTH → READY → CLOSE
```

---

## Works Well With

**Tools**: Wireshark, tshark, tcpdump, mitmproxy, Burp Suite
**Skills**: bash-optimizer, python-optimization
**Agents**: reverse-engineer

---

## Reference

- [Full parser examples](reference.md)
- [Wireshark display filter reference](https://wiki.wireshark.org/DisplayFilters)
- [Protocol documentation templates](modules/templates.md)
