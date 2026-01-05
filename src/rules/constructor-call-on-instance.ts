import { LintRule, RuleContext, RuleListener, TreeSitterNode } from '../types';

/**
 * Rule: constructor-call-on-instance
 * Disallow calling constructors on instances (should use class)
 */
export const constructorCallOnInstanceRule: LintRule = {
    id: 'constructor-call-on-instance',
    meta: {
        description: 'Disallow calling constructor on instance variables',
        category: 'error',
        fixable: false,
        docs: {
            description:
                'Constructors should be called on class types, not on existing instances. Calling constructor on instance can cause memory leaks.',
        },
    },
    defaultSeverity: 'error',
    create(context: RuleContext): RuleListener {
        return {
            call_expression(node: TreeSitterNode) {
                const text = node.text;

                // Look for pattern: instance.Create(...) where instance is lowercase
                // or starts with common instance prefixes
                const createPattern = /^([a-zA-Z_][a-zA-Z0-9_]*)\.Create\b/i;
                const match = text.match(createPattern);

                if (match) {
                    const identifier = match[1];

                    // If it starts with lowercase or common instance prefixes, it's likely an instance
                    const isLikelyInstance =
                        /^[a-z]/.test(identifier) || // starts with lowercase
                        /^(F|Self|my|the|a)[A-Z]/.test(identifier); // common prefixes

                    // Class names typically start with T
                    const isLikelyClass = /^T[A-Z]/.test(identifier);

                    if (isLikelyInstance && !isLikelyClass) {
                        context.report({
                            message: `Calling Create on instance '${identifier}'. Use 'T${capitalizeFirst(identifier)}.Create' instead to create a new object.`,
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
                }
            },
        };
    },
};

function capitalizeFirst(str: string): string {
    if (!str) return str;
    // Remove common prefixes
    let name = str;
    if (str.startsWith('F') && str.length > 1 && /[A-Z]/.test(str[1])) {
        name = str.substring(1);
    }
    return name.charAt(0).toUpperCase() + name.slice(1);
}
