"""Deliberately failing suite for the py-mini fixture.

Run with:  python -m unittest -v test_fail

It exists so the executor can prove that a failing test suite propagates as a
non-zero exit code and a "failed" run state instead of being swallowed. It is
never part of the green suite.
"""

import unittest

from calc import add


class FailTests(unittest.TestCase):
    def test_deliberate_failure(self):
        self.assertEqual(add(2, 3), 6)


if __name__ == "__main__":
    unittest.main()
