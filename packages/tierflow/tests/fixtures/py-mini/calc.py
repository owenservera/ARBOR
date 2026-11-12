"""Minimal Python module used as an unrelated-project fixture.

Deliberately dependency-free: standard library only, no packaging, no git,
no HQ.
"""


def add(a, b):
    """Return the sum of two numbers."""
    return a + b


def mul(a, b):
    """Return the product of two numbers."""
    return a * b
