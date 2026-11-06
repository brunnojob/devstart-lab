import importlib.util
from pathlib import Path
import unittest

path = Path(__file__).resolve().parents[1] / 'public/challenges/two-sum/solution.py'
spec = importlib.util.spec_from_file_location('two_sum_solution', path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class TwoSumTests(unittest.TestCase):
    def test_examples_and_boundaries(self):
        cases = [([2, 7, 11, 15], 9, [0, 1]), ([3, 2, 4], 6, [1, 2]),
                 ([3, 3], 6, [0, 1]), ([0, 4, 3, 0], 0, [0, 3]),
                 ([-3, 4, 3, 90], 0, [0, 2]), ([1, 2, 3], 99, []),
                 ([3], 6, []), ([], 0, [])]
        for nums, target, expected in cases:
            with self.subTest(nums=nums, target=target):
                before = nums.copy()
                result = module.Solution().twoSum(nums, target)
                self.assertEqual(result, expected)
                self.assertEqual(nums, before)

    def test_matches_brute_force_existence_on_small_inputs(self):
        from itertools import product
        for values in product(range(-2, 3), repeat=3):
            for target in range(-4, 5):
                nums = list(values)
                result = module.Solution().twoSum(nums, target)
                possible = any(nums[i] + nums[j] == target
                               for i in range(len(nums)) for j in range(i + 1, len(nums)))
                self.assertEqual(bool(result), possible)
                if result:
                    i, j = result
                    self.assertNotEqual(i, j)
                    self.assertEqual(nums[i] + nums[j], target)
