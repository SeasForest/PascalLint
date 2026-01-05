import { LintRule, RuleContext, RuleListener, TreeSitterNode } from '../types';

/**
 * Rule: no-semicolon-before-else
 * Disallow semicolon before 'else' keyword
 */
export const noSemicolonBeforeElseRule: LintRule = {
    id: 'no-semicolon-before-else',
    meta: {
        description: "Disallow semicolon before 'else' keyword",
        category: 'error',
        fixable: true,
        docs: {
            description:
                "In Pascal, a semicolon before 'else' is a syntax error or creates an empty statement.",
        },
    },
    defaultSeverity: 'error',
    create(context: RuleContext): RuleListener {
        return {
            if_statement(node: TreeSitterNode) {
                // Find the else clause
                const sourceCode = context.getSourceCode();

                // Look for semicolon immediately before 'else'
                const elseChild = node.children.find(child =>
                    child.type === 'else' || child.text.toLowerCase() === 'else'
                );

                if (elseChild) {
                    // Check the character before 'else'
                    const beforeElse = sourceCode.substring(0, elseChild.startIndex).trimEnd();
                    if (beforeElse.endsWith(';')) {
                        // Find the semicolon position
                        const semicolonIndex = beforeElse.lastIndexOf(';');
                        const lines = sourceCode.substring(0, semicolonIndex + 1).split('\n');
                        const line = lines.length - 1;
                        const column = lines[lines.length - 1].length - 1;

                        context.report({
                            message: "Unexpected semicolon before 'else'.",
                            range: {
                                start: { line, column, offset: semicolonIndex },
                                end: { line, column: column + 1, offset: semicolonIndex + 1 },
                            },
                            fix: {
                                range: {
                                    start: { line, column, offset: semicolonIndex },
                                    end: { line, column: column + 1, offset: semicolonIndex + 1 },
                                },
                                text: '',
                            },
                        });
                    }
                }
            },
        };
    },
};
