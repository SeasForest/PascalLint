import { emptyBeginEndRule } from '../../src/rules/empty-begin-end';
import { LintIssue, RuleContext, TreeSitterNode } from '../../src/types';

describe('empty-begin-end rule', () => {
    let issues: LintIssue[];
    let context: RuleContext;

    beforeEach(() => {
        issues = [];
        context = {
            report(issue) {
                issues.push({
                    ruleId: 'empty-begin-end',
                    severity: 'warn',
                    ...issue,
                });
            },
            getSourceCode: () => '',
            getFilename: () => 'test.pas',
        };
    });

    it('should report empty begin...end block', () => {
        const listener = emptyBeginEndRule.create(context);
        const mockNode: Partial<TreeSitterNode> = {
            // tree-sitter-pascal uses 'block' node type
            type: 'block',
            text: 'begin\nend',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 1, column: 3 },
            startIndex: 0,
            endIndex: 9,
            namedChildren: [
                { type: 'kBegin', text: 'begin' } as TreeSitterNode,
                { type: 'kEnd', text: 'end' } as TreeSitterNode,
            ],
        };

        // Call the 'block' handler (not 'compound_statement')
        listener.block?.(mockNode as TreeSitterNode);

        expect(issues).toHaveLength(1);
        expect(issues[0].ruleId).toBe('empty-begin-end');
        expect(issues[0].fix).toBeDefined();
    });

    it('should not report non-empty begin...end block', () => {
        const listener = emptyBeginEndRule.create(context);
        const mockNode: Partial<TreeSitterNode> = {
            type: 'block',
            text: 'begin\n  x := 1;\nend',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 2, column: 3 },
            startIndex: 0,
            endIndex: 18,
            namedChildren: [
                { type: 'kBegin', text: 'begin' } as TreeSitterNode,
                { type: 'statement', text: 'x := 1;' } as TreeSitterNode,
                { type: 'kEnd', text: 'end' } as TreeSitterNode,
            ],
        };

        listener.block?.(mockNode as TreeSitterNode);

        expect(issues).toHaveLength(0);
    });

    it('should have correct metadata', () => {
        expect(emptyBeginEndRule.id).toBe('empty-begin-end');
        expect(emptyBeginEndRule.meta.fixable).toBe(true);
        expect(emptyBeginEndRule.defaultSeverity).toBe('warn');
    });
});
