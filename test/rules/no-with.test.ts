import { noWithRule } from '../../src/rules/no-with';
import { LintIssue, RuleContext, TreeSitterNode } from '../../src/types';

describe('no-with rule', () => {
    let issues: LintIssue[];
    let context: RuleContext;

    beforeEach(() => {
        issues = [];
        context = {
            report(issue) {
                issues.push({
                    ruleId: 'no-with',
                    severity: 'error',
                    ...issue,
                });
            },
            getSourceCode: () => '',
            getFilename: () => 'test.pas',
        };
    });

    it('should report with statement', () => {
        const listener = noWithRule.create(context);
        const mockNode: Partial<TreeSitterNode> = {
            // tree-sitter-pascal uses 'with' node type
            type: 'with',
            text: 'with Form1 do Show;',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 19 },
            startIndex: 0,
            endIndex: 19,
        };

        // Call the 'with' handler (not 'with_statement')
        listener.with?.(mockNode as TreeSitterNode);

        expect(issues).toHaveLength(1);
        expect(issues[0].ruleId).toBe('no-with');
        expect(issues[0].message).toContain('with');
    });

    it('should have correct metadata', () => {
        expect(noWithRule.id).toBe('no-with');
        expect(noWithRule.meta.fixable).toBe(false);
        expect(noWithRule.defaultSeverity).toBe('error');
    });
});
