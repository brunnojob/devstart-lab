# Two Sum in Python

A beginner exercise inspired by [LeetCode 1: Two Sum](https://leetcode.com/problems/two-sum/). This explanation and implementation are original learning material; DevStart Lab is not affiliated with LeetCode.

## Challenge

Given a list of integers and a target, return the zero-based indices of two distinct elements whose values add up to the target. You cannot use the same element twice. The LeetCode problem guarantees exactly one valid pair and accepts either index order. Our implementation additionally returns an empty list when no pair exists.

| Input | Target | Output |
| --- | --- | --- |
| `[2, 7, 11, 15]` | `9` | `[0, 1]` |
| `[3, 2, 4]` | `6` | `[1, 2]` |
| `[3, 3]` | `6` | `[0, 1]` |

## Try before revealing the solution

1. Start with two nested loops over distinct indices. What is the time complexity?
2. For each number, compute `target - number`. What information would make that complement fast to find?
3. Store previously visited numbers with their indices in a dictionary.
4. Look up the complement **before** inserting the current number, so an element cannot match itself.

## Solution

See [solution.py](solution.py). Paste the `Solution` class into LeetCode's Python 3 editor, or import it locally. Running this file directly only defines the class; it does not read terminal input.

```python
from solution import Solution

assert Solution().twoSum([2, 7, 11, 15], 9) == [0, 1]
```

## Walkthrough

For `[2, 7, 11, 15]`, target `9`:

| Index | Number | Complement | Dictionary before lookup | Action |
| --- | --- | --- | --- | --- |
| 0 | 2 | 7 | `{}` | Store `2: 0` |
| 1 | 7 | 2 | `{2: 0}` | Return `[0, 1]` |

Return **indices**, not values. Duplicate values are allowed when they occupy distinct positions. The input list is not modified.

## Complexity

The brute-force approach checks up to n(n−1)/2 pairs: O(n²) time and O(1) auxiliary space. The dictionary approach visits each element once: expected O(n) time under average O(1) hash lookup/insertion, and O(n) auxiliary space. Hash-table operations are not a worst-case constant-time guarantee.

## Verification

From the repository root, run:

```bash
python3 -m unittest discover -s tests -p test_two_sum.py
```

Tests cover the examples, duplicates, zero, negative numbers, no solution, distinct indices and unchanged input. The security test workflow also discovers this test file.

## Next challenge

Implement the brute-force version and compare its result with the hash-map solution on small inputs. Explain why sorting first requires preserving original indices. Then try LeetCode's [Two Sum II](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/) using two pointers.
