import { LintRule, RuleContext, RuleListener, TreeSitterNode } from '../types';

/**
 * Rule: empty-begin-end
 * Detect empty begin...end blocks
 */
export const emptyBeginEndRule: LintRule = {
    id: 'empty-begin-end',
    meta: {
        description: 'Detect empty begin...end blocks',
        category: 'best-practice',
        fixable: true,
        docs: {
            description:
                'Empty begin...end blocks serve no purpose and may indicate incomplete code.',
        },
    },
    defaultSeverity: 'warn',
    create(context: RuleContext): RuleListener {
        return {
            // tree-sitter-pascal uses 'block' node type
            block(node: TreeSitterNode) {
                // A block has kBegin and kEnd as children
                // If it only has these two keywords (or comments), it's empty
                const meaningfulChildren = node.namedChildren.filter(child => {
                    const type = child.type;
                    // Skip keywords and comments
                    return type !== 'kBegin' && type !== 'kEnd' && type !== 'comment';
                });

                if (meaningfulChildren.length === 0) {
                    context.report({
                        message: 'Empty begin...end block detected.',
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
                        fix: {
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
                            text: '{ empty block removed }',
                        },
                    });
                }
            },
        };
    },
};
