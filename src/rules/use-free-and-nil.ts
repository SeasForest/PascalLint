import { LintRule, RuleContext, RuleListener, TreeSitterNode } from '../types';

/**
 * Rule: use-free-and-nil
 * Suggest using FreeAndNil(Obj) instead of Obj.Free
 */
export const useFreeAndNilRule: LintRule = {
    id: 'use-free-and-nil',
    meta: {
        description: 'Suggest using FreeAndNil instead of Obj.Free',
        category: 'best-practice',
        fixable: true,
        docs: {
            description:
                'FreeAndNil is safer because it sets the variable to nil after freeing, preventing dangling references.',
        },
    },
    defaultSeverity: 'warn',
    create(context: RuleContext): RuleListener {
        return {
            // tree-sitter-pascal uses 'statement' for calls
            statement(node: TreeSitterNode) {
                const text = node.text;

                // Pattern: identifier.Free followed by semicolon
                const freePattern = /^(\w+)\.Free\s*;?$/i;
                const match = text.match(freePattern);

                if (match) {
                    const varName = match[1];
                    context.report({
                        message: `Consider using 'FreeAndNil(${varName})' instead of '${varName}.Free'.`,
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
                            text: `FreeAndNil(${varName});`,
                        },
                    });
                }
            },
        };
    },
};
