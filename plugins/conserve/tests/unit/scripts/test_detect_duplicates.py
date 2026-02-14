
import unittest
import tempfile
import shutil
from pathlib import Path
from plugins.conserve.scripts.detect_duplicates import extract_blocks, find_duplicates, normalize_line

class TestDetectDuplicates(unittest.TestCase):
    def setUp(self):
        self.test_dir = Path(tempfile.mkdtemp())
        self.file1 = self.test_dir / "file1.py"
        self.file2 = self.test_dir / "file2.py"

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_normalize_line(self):
        self.assertEqual(normalize_line("  a = 1  # comment ", "python"), "a = 1")
        self.assertEqual(normalize_line("  // comment ", "javascript"), "")
        self.assertEqual(normalize_line("  print('hello # world') ", "python"), "print('hello # world')")

    def test_extract_blocks(self):
        content = "a = 1\n" * 10
        self.file1.write_text(content)
        blocks = extract_blocks(self.file1, min_lines=5)
        # 10 lines, min_lines=5.
        # Windows: 0-5, 1-6, 2-7, 3-8, 4-9, 5-10.
        # Total 6 blocks.
        self.assertEqual(len(blocks), 6)

        # Check hash consistency
        hashes = [b[0] for b in blocks]
        self.assertEqual(len(set(hashes)), 1) # All blocks are identical

    def test_find_duplicates_identical_files(self):
        content = "def foo():\n    pass\n" * 5
        self.file1.write_text(content)
        self.file2.write_text(content)

        report = find_duplicates([self.test_dir], min_lines=5)

        # Should find at least one duplicate
        self.assertTrue(len(report.duplicates) > 0)

        # The content is duplicated in file2
        dup = report.duplicates[0]
        # It might find multiple duplicate blocks because of repetition within file too
        # But specifically, duplicate count should reflect file1 and file2
        self.assertGreaterEqual(dup.occurrence_count, 2)

    def test_find_duplicates_overlap(self):
        # A block that repeats itself with overlap
        # "a = 1\n" * 10. min_lines=5.
        # Blocks at 1-5, 2-6, 3-7, 4-8, 5-9, 6-10.
        # Non-overlapping: 1-5 and 6-10.
        content = "a = 1\n" * 10
        self.file1.write_text(content)

        report = find_duplicates([self.test_dir], min_lines=5)

        # Should find 1 duplicate group with 2 occurrences
        self.assertEqual(len(report.duplicates), 1)
        dup = report.duplicates[0]
        self.assertEqual(dup.occurrence_count, 2)
        self.assertEqual(dup.locations[0][1], 1) # First occurrence start line
        self.assertEqual(dup.locations[1][1], 6) # Second occurrence start line

if __name__ == '__main__':
    unittest.main()
