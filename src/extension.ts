import * as vscode from 'vscode';
import { LinterService } from './linter/linter-service';
import { CodeActionProvider } from './providers/code-action-provider';
import { cleanup } from './parser';

let linterService: LinterService;
let outputChannel: vscode.OutputChannel;
let isFixing = false; // Prevent infinite loop during fix

/**
 * Get workspace path for a document.
 * P0-2: Supports multiple workspaces.
 */
function getWorkspaceForDocument(document: vscode.TextDocument): string | undefined {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    return workspaceFolder?.uri.fsPath;
}

/**
 * Called when the extension is activated.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    // Create output channel for logging
    outputChannel = vscode.window.createOutputChannel('PascalLint');
    context.subscriptions.push(outputChannel);

    log('PascalLint activating...');

    // Initialize linter service
    linterService = new LinterService();

    try {
        await linterService.initialize(context.extensionPath);
        log('Linter initialized successfully');
    } catch (error) {
        logError('Failed to initialize linter', error);
        vscode.window.showErrorMessage(
            `PascalLint: Failed to initialize. ${error instanceof Error ? error.message : String(error)}`
        );
        return;
    }

    // Create diagnostic collection
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('pascallint');
    context.subscriptions.push(diagnosticCollection);

    // Register code action provider
    const codeActionProvider = new CodeActionProvider(linterService);
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            { language: 'pascal', scheme: 'file' },
            codeActionProvider,
            { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix, vscode.CodeActionKind.SourceFixAll] }
        )
    );

    // Register document change listener
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(async event => {
            if (isFixing) return;
            if (event.document.languageId === 'pascal') {
                await lintDocument(event.document, diagnosticCollection);
            }
        })
    );

    // Register document open listener
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(async document => {
            if (document.languageId === 'pascal') {
                await lintDocument(document, diagnosticCollection);
            }
        })
    );

    // Register document save listener
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(async document => {
            if (document.languageId === 'pascal') {
                await lintDocument(document, diagnosticCollection);
            }
        })
    );

    // Register document close listener - clear cache for closed documents
    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(document => {
            if (document.languageId === 'pascal') {
                linterService.clearCache(document.fileName);
            }
        })
    );

    // P0-2: Watch config file changes for ALL workspaces
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        for (const folder of workspaceFolders) {
            setupConfigWatcher(folder, diagnosticCollection, context);
        }
    }

    // Watch for new workspace folders being added
    context.subscriptions.push(
        vscode.workspace.onDidChangeWorkspaceFolders(event => {
            for (const folder of event.added) {
                setupConfigWatcher(folder, diagnosticCollection, context);
            }
            // Removed folders - clear their config
            for (const folder of event.removed) {
                log(`Workspace removed: ${folder.uri.fsPath}`);
            }
        })
    );

    // Register lint command
    context.subscriptions.push(
        vscode.commands.registerCommand('pascallint.lint', async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'pascal') {
                await lintDocument(editor.document, diagnosticCollection);
                vscode.window.showInformationMessage('PascalLint: Lint completed');
            }
        })
    );

    // Register fix command with infinite loop prevention
    context.subscriptions.push(
        vscode.commands.registerCommand('pascallint.fix', async () => {
            if (isFixing) return;

            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'pascal') {
                isFixing = true;
                try {
                    const workspacePath = getWorkspaceForDocument(editor.document);
                    const issues = await linterService.lint(
                        editor.document.getText(),
                        editor.document.fileName,
                        workspacePath,
                        editor.document.version
                    );
                    const fixableIssues = issues.filter(issue => issue.fix);

                    if (fixableIssues.length > 0) {
                        const edit = new vscode.WorkspaceEdit();
                        const sortedFixes = fixableIssues
                            .filter(issue => issue.fix)
                            .sort((a, b) => (b.fix!.range.start.offset ?? 0) - (a.fix!.range.start.offset ?? 0));

                        for (const issue of sortedFixes) {
                            if (issue.fix) {
                                const range = new vscode.Range(
                                    issue.fix.range.start.line,
                                    issue.fix.range.start.column,
                                    issue.fix.range.end.line,
                                    issue.fix.range.end.column
                                );
                                edit.replace(editor.document.uri, range, issue.fix.text);
                            }
                        }

                        await vscode.workspace.applyEdit(edit);
                        log(`Fixed ${sortedFixes.length} issues`);
                        vscode.window.showInformationMessage(`PascalLint: Fixed ${sortedFixes.length} issue(s)`);
                    } else {
                        vscode.window.showInformationMessage('PascalLint: No fixable issues found');
                    }
                } catch (error) {
                    logError('Fix command failed', error);
                    vscode.window.showErrorMessage(
                        `PascalLint: Fix failed. ${error instanceof Error ? error.message : String(error)}`
                    );
                } finally {
                    setTimeout(() => {
                        isFixing = false;
                    }, 300);
                }
            }
        })
    );

    // Lint all open Pascal documents
    for (const document of vscode.workspace.textDocuments) {
        if (document.languageId === 'pascal') {
            await lintDocument(document, diagnosticCollection);
        }
    }

    log('PascalLint activated');
}

/**
 * Setup config file watcher for a workspace folder.
 * P0-2: Each workspace gets its own watcher.
 */
function setupConfigWatcher(
    folder: vscode.WorkspaceFolder,
    diagnosticCollection: vscode.DiagnosticCollection,
    context: vscode.ExtensionContext
): void {
    const configPattern = new vscode.RelativePattern(folder, '**/.PascalLint.json');
    const watcher = vscode.workspace.createFileSystemWatcher(configPattern);

    watcher.onDidChange(async () => {
        log(`Config file changed in workspace: ${folder.uri.fsPath}`);
        try {
            await linterService.reloadConfigForWorkspace(folder.uri.fsPath);
            // Re-lint documents in this workspace
            for (const doc of vscode.workspace.textDocuments) {
                if (doc.languageId === 'pascal') {
                    const docWorkspace = getWorkspaceForDocument(doc);
                    if (docWorkspace === folder.uri.fsPath) {
                        await lintDocument(doc, diagnosticCollection);
                    }
                }
            }
            vscode.window.showInformationMessage(`PascalLint: Configuration reloaded for ${folder.name}`);
        } catch (error) {
            logError('Failed to reload config', error);
        }
    });

    context.subscriptions.push(watcher);
    log(`Config watcher setup for workspace: ${folder.uri.fsPath}`);
}

/**
 * Lint a document and update diagnostics.
 * P0-2: Passes workspace path for correct config lookup.
 */
async function lintDocument(
    document: vscode.TextDocument,
    diagnosticCollection: vscode.DiagnosticCollection
): Promise<void> {
    try {
        const startTime = performance.now();
        const workspacePath = getWorkspaceForDocument(document);

        // P0-2: Pass workspace path and document version
        const issues = await linterService.lint(
            document.getText(),
            document.fileName,
            workspacePath,
            document.version
        );

        const elapsed = performance.now() - startTime;

        if (elapsed > 500) {
            log(`Warning: Lint took ${elapsed.toFixed(0)}ms for ${document.fileName}`);
        }

        const diagnostics: vscode.Diagnostic[] = issues.map(issue => {
            const range = new vscode.Range(
                issue.range.start.line,
                issue.range.start.column,
                issue.range.end.line,
                issue.range.end.column
            );

            const diagnostic = new vscode.Diagnostic(
                range,
                issue.message,
                severityToVscode(issue.severity)
            );

            diagnostic.code = issue.ruleId;
            diagnostic.source = 'PascalLint';

            return diagnostic;
        });

        diagnosticCollection.set(document.uri, diagnostics);
    } catch (error) {
        logError(`Failed to lint ${document.fileName}`, error);

        const errorDiagnostic = new vscode.Diagnostic(
            new vscode.Range(0, 0, 0, 0),
            `PascalLint error: ${error instanceof Error ? error.message : String(error)}`,
            vscode.DiagnosticSeverity.Error
        );
        errorDiagnostic.source = 'PascalLint';
        diagnosticCollection.set(document.uri, [errorDiagnostic]);
    }
}

/**
 * Convert PascalLint severity to VSCode severity.
 */
function severityToVscode(severity: string): vscode.DiagnosticSeverity {
    switch (severity) {
        case 'error':
            return vscode.DiagnosticSeverity.Error;
        case 'warn':
        case 'warning':
            return vscode.DiagnosticSeverity.Warning;
        case 'info':
            return vscode.DiagnosticSeverity.Information;
        default:
            return vscode.DiagnosticSeverity.Hint;
    }
}

/**
 * Log message to output channel.
 */
function log(message: string): void {
    const timestamp = new Date().toISOString();
    outputChannel.appendLine(`[${timestamp}] ${message}`);
}

/**
 * Log error to output channel.
 */
function logError(message: string, error: unknown): void {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    outputChannel.appendLine(`[${timestamp}] ERROR: ${message}: ${errorMessage}`);
    if (stack) {
        outputChannel.appendLine(stack);
    }
}

/**
 * Called when the extension is deactivated.
 * P0-1: Cleans up all resources including WASM memory.
 */
export async function deactivate(): Promise<void> {
    log('PascalLint deactivating...');

    // P0-1: Cleanup linter (releases all Tree objects)
    if (linterService) {
        linterService.cleanup();
    }

    // Cleanup parser WASM resources
    await cleanup();
}
