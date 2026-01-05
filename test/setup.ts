/**
 * Test setup file for Jest
 */

// Extend Jest matchers if needed
expect.extend({
    toHaveIssueWithId(issues: Array<{ ruleId: string }>, expectedId: string) {
        const found = issues.some(issue => issue.ruleId === expectedId);
        if (found) {
            return {
                message: () => `expected issues not to contain rule "${expectedId}"`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected issues to contain rule "${expectedId}"`,
                pass: false,
            };
        }
    },
});

// Increase timeout for async tests
jest.setTimeout(10000);

// Mock console.log during tests to reduce noise
// Uncomment if needed:
// jest.spyOn(console, 'log').mockImplementation(() => {});
