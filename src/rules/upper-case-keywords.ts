import { LintRule, RuleContext, RuleListener, TreeSitterNode } from '../types';

/**
 * Rule: upper-case-keywords
 * Enforce consistent keyword casing (lowercase or uppercase)
 */
export const upperCaseKeywordsRule: LintRule = {
    id: 'upper-case-keywords',
    meta: {
        description: 'Enforce consistent keyword casing',
        category: 'style',
        fixable: true,
        docs: {
            description:
                'Keywords should use consistent casing. Default is lowercase.',
        },
    },
    defaultSeverity: 'info',
    create(context: RuleContext): RuleListener {
        // List of Pascal keywords
        const keywords = [
            'begin', 'end', 'if', 'then', 'else', 'case', 'of',
            'for', 'to', 'downto', 'do', 'while', 'repeat', 'until',
            'try', 'except', 'finally', 'raise',
            'procedure', 'function', 'var', 'const', 'type',
            'class', 'interface', 'implementation', 'unit', 'uses',
            'and', 'or', 'not', 'xor', 'div', 'mod', 'shl', 'shr',
            'nil', 'true', 'false', 'inherited', 'self',
            'array', 'record', 'set', 'file', 'string',
            'in', 'is', 'as', 'with', 'property', 'read', 'write',
            'private', 'protected', 'public', 'published', 'strict',
            'virtual', 'override', 'reintroduce', 'abstract', 'dynamic',
            'overload', 'inline', 'forward', 'external', 'cdecl', 'stdcall',
        ];

        const keywordSet = new Set(keywords);

        return {
            // Check any node that might be a keyword
            '*'(node: TreeSitterNode) {
                const text = node.text;
                const lowerText = text.toLowerCase();

                // Only check leaf nodes (no children)
                if (node.namedChildren.length > 0) {
                    return;
                }

                // Skip if not a keyword
                if (!keywordSet.has(lowerText)) {
                    return;
                }

                // Check if already lowercase
                if (text === lowerText) {
                    return;
                }

                context.report({
                    message: `Keyword '${text}' should be lowercase '${lowerText}'.`,
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
                        text: lowerText,
                    },
                });
            },
        };
    },
};
