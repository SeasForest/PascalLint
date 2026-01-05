import { danglingSemicolonRule } from '../../src/rules/dangling-semicolon';
import { LintIssue, RuleContext, TreeSitterNode } from '../../src/types';

describe('dangling-semicolon rule', () => {
    let issues: LintIssue[];
    let context: RuleContext;

    beforeEach(() => {
        issues = [];
    });

    it('should detect semicolon after then', () => {
        const sourceCode = 'if x > 0 then; y := 1;';
        context = {
            report(issue) {
                issues.push({
                    ruleId: 'dangling-semicolon',
                    severity: 'error',
                    ...issue,
                });
            },
            getSourceCode: () => sourceCode,
            getFilename: () => 'test.pas',
        };

        const listener = danglingSemicolonRule.create(context);
        const mockNode: Partial<TreeSitterNode> = {
            type: 'if_statement',
            text: 'if x > 0 then;',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 14 },
            startIndex: 0,
            endIndex: 14,
        };

        listener.if_statement?.(mockNode as TreeSitterNode);

        expect(issues).toHaveLength(1);
        expect(issues[0].message).toContain('semicolon');
        expect(issues[0].fix).toBeDefined();
    });

    it('should have correct metadata', () => {
        expect(danglingSemicolonRule.id).toBe('dangling-semicolon');
        expect(danglingSemicolonRule.meta.fixable).toBe(true);
        expect(danglingSemicolonRule.defaultSeverity).toBe('error');
    });
});
