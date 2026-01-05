import Parser from 'web-tree-sitter';
import { LintIssue, LintRule, RuleContext, RuleListener, Severity, TreeSitterNode } from '../types';
import { initializeParser, parse, parseIncremental } from '../parser';
import { allRules } from '../rules';
import { loadConfigForWorkspace, getDefaultRules } from '../config';

/**
 * Cached tree entry with content hash for change detection
 */
interface TreeCacheEntry {
    tree: Parser.Tree;
    content: string;
    version: number;
}

/**
 * Linter service - orchestrates parsing and rule execution.
 * 
 * P0-1 Fix: Manages Tree lifecycle with explicit delete() calls
 * P0-2 Fix: Supports multiple workspaces with per-workspace config
 * P1-2 Fix: Implements incremental parsing for better performance
 */
export class LinterService {
    private rules: LintRule[] = [];
    private initialized = false;
    private initPromise: Promise<void> | null = null;


    // P0-2: Per-workspace configuration
    private workspaceConfigs = new Map<string, Record<string, Severity | [Severity, Record<string, unknown>]>>();

    // P0-1 & P1-2: Tree cache with lifecycle management
    private treeCache = new Map<string, TreeCacheEntry>();

    // P1-1: Lint result cache (use absolute path as key)
    private lintResultCache = new Map<string, { content: string; issues: LintIssue[] }>();

    // P2-3: WeakMap cache for adaptNode to reduce GC pressure
    private nodeAdapterCache = new WeakMap<Parser.SyntaxNode, TreeSitterNode>();

    /**
     * Initialize the linter with parser and rules.
     * Safe to call multiple times - returns same promise if initialization is in progress.
     */
    async initialize(extensionPath: string): Promise<void> {
        if (this.initPromise) {
            return this.initPromise;
        }

        if (this.initialized) {
            return;
        }


        this.initPromise = (async () => {
            try {
                await initializeParser(extensionPath);
                this.rules = allRules;
                this.initialized = true;
            } catch (error) {
                this.initPromise = null;
                throw error;
            }
        })();

        return this.initPromise;
    }

    /**
     * Check if linter is initialized.
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Ensure linter is initialized before linting.
     */
    private async ensureInitialized(): Promise<void> {
        if (this.initialized) {
            return;
        }
        if (this.initPromise) {
            await this.initPromise;
            return;
        }
        throw new Error('LinterService not initialized. Call initialize first.');
    }

    /**
     * Get config for a specific workspace.
     * P0-2: Supports multiple workspaces.
     */
    async getConfigForWorkspace(workspacePath: string): Promise<Record<string, Severity | [Severity, Record<string, unknown>]>> {
        let config = this.workspaceConfigs.get(workspacePath);
        if (!config) {
            config = await loadConfigForWorkspace(workspacePath);
            this.workspaceConfigs.set(workspacePath, config);
        }
        return config;
    }

    /**
     * Reload config for a specific workspace.
     */
    async reloadConfigForWorkspace(workspacePath: string): Promise<void> {
        const config = await loadConfigForWorkspace(workspacePath);
        this.workspaceConfigs.set(workspacePath, config);
        // Clear lint result cache for this workspace
        for (const key of this.lintResultCache.keys()) {
            if (key.startsWith(workspacePath)) {
                this.lintResultCache.delete(key);
            }
        }
    }

    /**
     * Lint source code and return issues.
     * 
     * @param sourceCode - The source code to lint
     * @param filename - Absolute file path (used as cache key)
     * @param workspacePath - Workspace root path for config lookup
     * @param version - Document version for incremental parsing
     * @param edit - Optional Parser.Edit for incremental parsing
     */
    async lint(
        sourceCode: string,
        filename: string,
        workspacePath?: string,
        version?: number,
        edit?: Parser.Edit
    ): Promise<LintIssue[]> {
        await this.ensureInitialized();

        // P1-1: Use absolute path as cache key to avoid conflicts
        const cacheKey = filename; // filename should be absolute path from VSCode

        // Check lint result cache
        const cachedResult = this.lintResultCache.get(cacheKey);
        if (cachedResult && cachedResult.content === sourceCode) {
            return cachedResult.issues;
        }

        // P0-2: Get config for the workspace
        const config = workspacePath
            ? await this.getConfigForWorkspace(workspacePath)
            : getDefaultRules();

        // P0-1 & P1-3: Use cached tree with incremental parsing
        const tree = this.getOrCreateTree(cacheKey, sourceCode, version ?? 0, edit);

        const issues: LintIssue[] = [];

        // Build rule listeners map
        const listenersByNodeType: Map<string, Array<{ rule: LintRule; listener: RuleListener }>> =
            new Map();

        for (const rule of this.rules) {
            const severity = this.getRuleSeverity(rule.id, config);
            if (severity === 'off') {
                continue;
            }

            const context = this.createRuleContext(rule, severity, sourceCode, filename, issues);
            const listener = rule.create(context);

            for (const nodeType of Object.keys(listener)) {
                if (!listenersByNodeType.has(nodeType)) {
                    listenersByNodeType.set(nodeType, []);
                }
                listenersByNodeType.get(nodeType)!.push({ rule, listener });
            }
        }

        // Traverse AST and invoke listeners
        this.traverseTree(tree.rootNode, listenersByNodeType);

        // Cache the results
        this.lintResultCache.set(cacheKey, { content: sourceCode, issues });

        return issues;
    }

    /**
     * Get or create a parsed tree for a file.
     * P0-1: Manages tree lifecycle with explicit delete()
     * P1-3: Uses incremental parsing when edit info is available
     */
    private getOrCreateTree(
        filename: string,
        sourceCode: string,
        version: number,
        edit?: Parser.Edit
    ): Parser.Tree {
        const cached = this.treeCache.get(filename);

        if (cached) {
            // If content hasn't changed, reuse the tree
            if (cached.content === sourceCode) {
                return cached.tree;
            }

            // Content changed - use incremental parsing if edit info available
            if (version > cached.version && edit) {
                // P1-3: Use incremental parsing for better performance
                const newTree = parseIncremental(sourceCode, cached.tree, edit);
                cached.tree.delete(); // Release old tree
                this.treeCache.set(filename, {
                    tree: newTree,
                    content: sourceCode,
                    version,
                });
                return newTree;
            } else {
                // No edit info, do full re-parse
                cached.tree.delete(); // P0-1: Explicit WASM memory release
            }
        }

        // Create new tree (full parse)
        const tree = parse(sourceCode);
        this.treeCache.set(filename, {
            tree,
            content: sourceCode,
            version,
        });

        return tree;
    }

    /**
     * Get cached lint results for a file (for CodeActionProvider).
     * Uses absolute path as key.
     */
    getCachedResults(filename: string): LintIssue[] | undefined {
        return this.lintResultCache.get(filename)?.issues;
    }

    /**
     * Clear cache for a file.
     * P0-1: Also releases tree memory.
     */
    clearCache(filename?: string): void {
        if (filename) {
            // Clear specific file
            this.lintResultCache.delete(filename);
            const treeCached = this.treeCache.get(filename);
            if (treeCached) {
                treeCached.tree.delete(); // P0-1: Release WASM memory
                this.treeCache.delete(filename);
            }
        } else {
            // Clear all
            this.lintResultCache.clear();
            for (const cached of this.treeCache.values()) {
                cached.tree.delete(); // P0-1: Release all WASM memory
            }
            this.treeCache.clear();
        }
    }

    /**
     * Cleanup all resources.
     * P0-1: Must be called when extension is deactivated.
     */
    cleanup(): void {
        this.clearCache();
        this.workspaceConfigs.clear();
    }

    /**
     * Get effective severity for a rule.
     */
    private getRuleSeverity(
        ruleId: string,
        config: Record<string, Severity | [Severity, Record<string, unknown>]>
    ): Severity {
        const ruleConfig = config[ruleId];
        if (ruleConfig === undefined) {
            const rule = this.rules.find(r => r.id === ruleId);
            return rule?.defaultSeverity ?? 'off';
        }
        if (Array.isArray(ruleConfig)) {
            return ruleConfig[0];
        }
        return ruleConfig;
    }

    /**
     * Create rule context for a specific rule.
     */
    private createRuleContext(
        rule: LintRule,
        severity: Severity,
        sourceCode: string,
        filename: string,
        issues: LintIssue[]
    ): RuleContext {
        return {
            report(issue) {
                issues.push({
                    ruleId: rule.id,
                    severity,
                    ...issue,
                });
            },
            getSourceCode() {
                return sourceCode;
            },
            getFilename() {
                return filename;
            },
        };
    }

    /**
     * Traverse AST and invoke rule listeners.
     */
    private traverseTree(
        node: Parser.SyntaxNode,
        listenersByNodeType: Map<string, Array<{ rule: LintRule; listener: RuleListener }>>
    ): void {
        const listeners = listenersByNodeType.get(node.type);
        if (listeners) {
            for (const { listener } of listeners) {
                const handler = listener[node.type];
                if (handler) {
                    // Pass Parser.SyntaxNode directly - compatible with our simplified TreeSitterNode
                    handler(this.adaptNode(node));
                }
            }
        }

        for (const child of node.children) {
            this.traverseTree(child, listenersByNodeType);
        }
    }

    /**
     * Adapt Parser.SyntaxNode to our TreeSitterNode interface.
     * P2-3: Uses WeakMap cache to avoid creating duplicate adapters.
     */
    private adaptNode(node: Parser.SyntaxNode): TreeSitterNode {
        // P2-3: Check cache first to reduce GC pressure
        const cached = this.nodeAdapterCache.get(node);
        if (cached) {
            return cached;
        }

        const self = this;
        const adapted: TreeSitterNode = {
            type: node.type,
            text: node.text,
            startPosition: node.startPosition,
            endPosition: node.endPosition,
            startIndex: node.startIndex,
            endIndex: node.endIndex,
            // Lazy-load children to avoid stack overflow
            get children() {
                return node.children.map(c => self.adaptNode(c));
            },
            get namedChildren() {
                return node.namedChildren.map(c => self.adaptNode(c));
            },
            // Don't recursively adapt parent - just return null to avoid infinite loop
            parent: null,
            childForFieldName: (name: string) => {
                const child = node.childForFieldName(name);
                return child ? self.adaptNode(child) : null;
            },
            descendantsOfType: (types: string | string[]) => {
                return node.descendantsOfType(types).map(c => self.adaptNode(c));
            },
        };

        // P2-3: Cache the adapted node
        this.nodeAdapterCache.set(node, adapted);
        return adapted;
    }

    /**
     * Get all loaded rules.
     */
    getRules(): LintRule[] {
        return this.rules;
    }
}
