import { LintRule, RuleContext, RuleListener, TreeSitterNode } from '../types';

/**
 * Rule: no-with
 * Disallow `with` statements as they make code harder to maintain
 */
export const noWithRule: LintRule = {
    id: 'no-with',
    meta: {
        description: 'Disallow with statement',
        category: 'error',
        fixable: false,
        docs: {
            description:
                'The `with` statement makes code harder to read and maintain. It can hide variable scope issues.',
        },
    },
    defaultSeverity: 'error',
    create(context: RuleContext): RuleListener {
        return {
            // tree-sitter-pascal uses 'with' node type
            with(node: TreeSitterNode) {
                context.report({
                    message: 'Avoid using `with` statement.',
                    range: {
                        start: {
                            line: node.startPosition.row,
                            column: node.startPosition.column,
                            offset: node.startIndex,
                        },
                        end: {
                            line: node.endPosition.row,
                            column: node.endPosition.column,
                            offset: node.endIndex,
                        },
                    },
                });
            },
        };
    },
};
