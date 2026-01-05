import { LintRule, RuleContext, RuleListener, TreeSitterNode } from '../types';

/**
 * Rule: dangling-semicolon
 * Detect unintended empty statements (semicolons after control statements)
 */
export const danglingSemicolonRule: LintRule = {
    id: 'dangling-semicolon',
    meta: {
        description: 'Detect unintended empty statement (dangling semicolon)',
        category: 'error',
        fixable: true,
        docs: {
            description:
                'A semicolon immediately after if/while/for creates an empty statement, which is usually a bug.',
        },
    },
    defaultSeverity: 'error',
    create(context: RuleContext): RuleListener {
        return {
            if_statement(node: TreeSitterNode) {
                checkDanglingSemicolon(node, context, 'if');
            },
            while_statement(node: TreeSitterNode) {
                checkDanglingSemicolon(node, context, 'while');
            },
            for_statement(node: TreeSitterNode) {
                checkDanglingSemicolon(node, context, 'for');
            },
        };
    },
};

function checkDanglingSemicolon(
    node: TreeSitterNode,
    context: RuleContext,
    statementType: string
): void {
    // Look for a semicolon that creates an empty statement
    const sourceCode = context.getSourceCode();
    const nodeText = node.text;

    // Pattern: control statement followed immediately by semicolon
    // e.g., "if condition then;" or "while condition do;"
    const patterns = [
        /\bthen\s*;/i,
        /\bdo\s*;/i,
    ];

    for (const pattern of patterns) {
        const match = nodeText.match(pattern);
        if (match && match.index !== undefined) {
            const startOffset = node.startIndex + match.index;
            const endOffset = startOffset + match[0].length;
            const semicolonOffset = endOffset - 1;

            // Calculate line/column for the semicolon
            const textBefore = sourceCode.substring(0, semicolonOffset);
            const lines = textBefore.split('\n');
            const line = lines.length - 1;
            const column = lines[lines.length - 1].length;

            context.report({
                message: `Unexpected semicolon after '${statementType}' creates an empty statement.`,
                range: {
                    start: { line, column, offset: semicolonOffset },
                    end: { line, column: column + 1, offset: semicolonOffset + 1 },
                },
                fix: {
                    range: {
                        start: { line, column, offset: semicolonOffset },
                        end: { line, column: column + 1, offset: semicolonOffset + 1 },
                    },
                    text: '',
                },
            });
        }
    }
}
