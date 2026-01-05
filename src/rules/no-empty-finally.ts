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
        fixable: true,
        docs: {
            description:
                'An empty finally block serves no purpose and may indicate incomplete code.',
        },
    },
    defaultSeverity: 'warn',
    create(context: RuleContext): RuleListener {
        return {
            try(node: TreeSitterNode) {
                // Check if the finally block is empty
                // Structure: try ... finally ... end
                // We need to check if 'finally' keyword exists, and if there are statements after it.

                let finallyKeywordIndex = -1;
                for (let i = 0; i < node.children.length; i++) {
                    if (node.children[i].type === 'kFinally') {
                        finallyKeywordIndex = i;
                        break;
                    }
                }

                if (finallyKeywordIndex !== -1) {
                    // Check children after finally keyword
                    // Ignore comments and end keyword
                    const afterFinally = node.children.slice(finallyKeywordIndex + 1);
                    const relevantChildren = afterFinally.filter(c =>
                        c.type !== 'kEnd' &&
                        c.type !== 'comment' &&
                        c.type !== 'end'
                    );

                    if (relevantChildren.length === 0) {
                        context.report({
                            message: 'Empty finally block detected.',
                            range: {
                                start: {
                                    line: node.children[finallyKeywordIndex].startPosition.row,
                                    column: node.children[finallyKeywordIndex].startPosition.column,
                                    offset: node.children[finallyKeywordIndex].startIndex
                                },
                                end: {
                                    line: node.children[finallyKeywordIndex].endPosition.row,
                                    column: node.children[finallyKeywordIndex].endPosition.column,
                                    offset: node.children[finallyKeywordIndex].endIndex
                                }
                            },
                            fix: {
                                range: {
                                    start: {
                                        line: node.children[finallyKeywordIndex].startPosition.row,
                                        column: node.children[finallyKeywordIndex].startPosition.column,
                                        offset: node.children[finallyKeywordIndex].startIndex
                                    },
                                    end: {
                                        line: node.endPosition.row,
                                        column: node.endPosition.column,
                                        offset: node.endIndex
                                    }
                                },
                                text: '// finally (empty removed)'
                            }
                        });
                    }
                }
            },
        };
    },
};
