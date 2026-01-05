/**
 * Position in source code
 */
export interface Position {
    line: number;
    column: number;
    offset?: number;
}

/**
 * Range in source code
 */
export interface Range {
    start: Position;
    end: Position;
}

/**
 * Severity level for lint issues
 */
export type Severity = 'error' | 'warn' | 'info' | 'off';

/**
 * Fix information for auto-fix
 */
export interface Fix {
    range: Range;
    text: string;
}

/**
 * A single lint issue
 */
export interface LintIssue {
    ruleId: string;
    message: string;
    severity: Severity;
    range: Range;
    fix?: Fix;
    suggestions?: Fix[];
}

/**
 * Rule metadata
 */
export interface RuleMeta {
    description: string;
    category: 'error' | 'best-practice' | 'style';
    fixable: boolean;
    docs?: {
        url?: string;
        description?: string;
    };
}

/**
 * Rule context passed to rule visitors
 */
export interface RuleContext {
    report(issue: Omit<LintIssue, 'ruleId' | 'severity'>): void;
    getSourceCode(): string;
    getFilename(): string;
}

/**
 * Rule listener - maps node types to visitor functions
 */
export type RuleListener = {
    [nodeType: string]: (node: TreeSitterNode) => void;
};

/**
 * Lint rule interface
 */
export interface LintRule {
    id: string;
    meta: RuleMeta;
    defaultSeverity: Severity;
    create(context: RuleContext): RuleListener;
}

/**
 * Tree-sitter node interface (simplified)
 */
export interface TreeSitterNode {
    type: string;
    text: string;
    startPosition: { row: number; column: number };
    endPosition: { row: number; column: number };
    startIndex: number;
    endIndex: number;
    children: TreeSitterNode[];
    namedChildren: TreeSitterNode[];
    parent: TreeSitterNode | null;
    childForFieldName(name: string): TreeSitterNode | null;
    descendantsOfType(types: string | string[]): TreeSitterNode[];
}

/**
 * Configuration for PascalLint
 */
export interface PascalLintConfig {
    extends?: string | string[];
    rules?: Record<string, Severity | [Severity, Record<string, unknown>]>;
    parserOptions?: {
        delphiVersion?: string;
    };
    ignorePatterns?: string[];
}
