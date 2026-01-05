import { LintRule, RuleContext, RuleListener, TreeSitterNode } from '../types';

/**
 * Rule: no-exit-in-finally
 * Disallow exit/raise in finally blocks
 */
export const noExitInFinallyRule: LintRule = {
    id: 'no-exit-in-finally',
    meta: {
        description: 'Disallow exit, raise, or break in finally blocks',
        category: 'error',
        fixable: true,
        docs: {
            description:
                'Using exit, raise, or break in finally blocks can cause unexpected behavior and hide exceptions.',
        },
    },
    defaultSeverity: 'error',
    create(context: RuleContext): RuleListener {
        let inFinallyBlock = false;

        return {
            finally_clause: {
                enter(_node: TreeSitterNode) {
                    inFinallyBlock = true;
                },
                leave(_node: TreeSitterNode) {
                    inFinallyBlock = false;
                },
            } as unknown as (node: TreeSitterNode) => void,

            exit_statement(node: TreeSitterNode) {
                if (inFinallyBlock) {
                    context.report({
                        message: 'Do not use Exit in finally block.',
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
                            text: `{ Error: Exit in finally }`
                        }
                    });
                }
            },

            raise_statement(node: TreeSitterNode) {
                if (inFinallyBlock) {
                    context.report({
                        message: 'Do not use Raise in finally block.',
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

            break_statement(node: TreeSitterNode) {
                if (inFinallyBlock) {
                    context.report({
                        message: 'Do not use Break in finally block.',
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
