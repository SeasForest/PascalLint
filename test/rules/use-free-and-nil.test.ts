import { useFreeAndNilRule } from '../../src/rules/use-free-and-nil';
import { LintIssue, RuleContext, TreeSitterNode } from '../../src/types';

describe('use-free-and-nil rule', () => {
    let issues: LintIssue[];
    let context: RuleContext;

    beforeEach(() => {
        issues = [];
        context = {
            report(issue) {
                issues.push({
                    ruleId: 'use-free-and-nil',
                    severity: 'warn',
                    ...issue,
                });
            },
            getSourceCode: () => '',
            getFilename: () => 'test.pas',
        };
    });

    it('should suggest FreeAndNil for .Free calls', () => {
        const listener = useFreeAndNilRule.create(context);
        const mockNode: Partial<TreeSitterNode> = {
            // tree-sitter-pascal uses 'statement' node type
            type: 'statement',
            text: 'MyObject.Free;',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 14 },
            startIndex: 0,
            endIndex: 14,
        };

        // Call the 'statement' handler (not 'call_expression')
        listener.statement?.(mockNode as TreeSitterNode);

        expect(issues).toHaveLength(1);
        expect(issues[0].message).toContain('FreeAndNil');
        expect(issues[0].fix?.text).toBe('FreeAndNil(MyObject);');
    });

    it('should not report non-Free calls', () => {
        const listener = useFreeAndNilRule.create(context);
        const mockNode: Partial<TreeSitterNode> = {
            type: 'statement',
            text: 'MyObject.DoSomething;',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 21 },
            startIndex: 0,
            endIndex: 21,
        };

        listener.statement?.(mockNode as TreeSitterNode);

        expect(issues).toHaveLength(0);
    });

    it('should have correct metadata', () => {
        expect(useFreeAndNilRule.id).toBe('use-free-and-nil');
        expect(useFreeAndNilRule.meta.fixable).toBe(true);
        expect(useFreeAndNilRule.defaultSeverity).toBe('warn');
    });
});
