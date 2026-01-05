import { LintRule, RuleContext, RuleListener, TreeSitterNode } from '../types';

/**
 * Rule: no-empty-finally
 * Disallow empty finally blocks
 */
export const noEmptyFinallyRule: LintRule = {
    id: 'no-empty-finally',
    meta: {
        description: 'Disallow empty finally blocks',
        category: 'error',
        fixable: false,
        docs: {
            description:
                'An empty finally block serves no purpose and may indicate incomplete code.',
        },
    },
    defaultSeverity: 'warn',
    create(context: RuleContext): RuleListener {
        return {
            finally_clause(node: TreeSitterNode) {
                // Check if the finally block is empty
                const children = node.namedChildren.filter(
                    child =>
                        child.type !== 'finally' &&
                        child.type !== 'end' &&
                        child.type !== 'comment' &&
                        child.text.trim() !== ''
                );

                if (children.length === 0) {
                    context.report({
                        message: 'Empty finally block detected.',
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
                }
            },
        };
    },
};
