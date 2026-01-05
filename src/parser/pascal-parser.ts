import Parser from 'web-tree-sitter';
import * as path from 'path';
import * as fs from 'fs';

let parser: Parser | null = null;
let pascalLanguage: Parser.Language | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the Tree-sitter parser with Pascal grammar.
 * Safe to call multiple times - will reuse existing initialization.
 * Returns same promise if initialization is in progress (prevents race condition).
 */
export async function initializeParser(extensionPath: string): Promise<void> {
    // Return existing promise if initialization is in progress
    if (initPromise) {
        return initPromise;
    }

    if (parser) {
        return; // Already initialized
    }

    initPromise = (async () => {
        try {
            await Parser.init();
            parser = new Parser();

            // Load Pascal WASM grammar
            const wasmPath = path.join(extensionPath, 'parsers', 'tree-sitter-pascal.wasm');

            if (!fs.existsSync(wasmPath)) {
                throw new Error(`Pascal grammar not found at: ${wasmPath}`);
            }

            pascalLanguage = await Parser.Language.load(wasmPath);
            parser.setLanguage(pascalLanguage);
        } catch (error) {
            // Reset state on failure so retry is possible
            parser = null;
            pascalLanguage = null;
            initPromise = null;
            throw error;
        }
    })();

    return initPromise;
}

/**
 * Parse Pascal source code and return AST.
 * @throws Error if parser not initialized
 */
export function parse(sourceCode: string): Parser.Tree {
    if (!parser) {
        throw new Error('Parser not initialized. Call initializeParser first.');
    }
    return parser.parse(sourceCode);
}

/**
 * Perform incremental parse with previous tree.
 * Much faster than full parse for small edits.
 */
export function parseIncremental(
    sourceCode: string,
    previousTree: Parser.Tree,
    edit: Parser.Edit
): Parser.Tree {
    if (!parser) {
        throw new Error('Parser not initialized. Call initializeParser first.');
    }
    previousTree.edit(edit);
    return parser.parse(sourceCode, previousTree);
}

/**
 * Check if parser is initialized.
 */
export function isInitialized(): boolean {
    return parser !== null;
}

/**
 * Get the parser instance (for testing).
 */
export function getParser(): Parser | null {
    return parser;
}

/**
 * Cleanup parser resources.
 * MUST be called when extension is deactivated to prevent memory leaks.
 */
export async function cleanup(): Promise<void> {
    if (parser) {
        // Note: web-tree-sitter Parser doesn't have explicit delete(),
        // but we should release references to allow GC
        parser = null;
        pascalLanguage = null;
        initPromise = null;
    }
}

/**
 * Reset parser (for testing).
 * @deprecated Use cleanup() instead
 */
export function resetParser(): void {
    parser = null;
    pascalLanguage = null;
    initPromise = null;
}
