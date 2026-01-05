import * as fs from 'fs';
import * as path from 'path';
import { PascalLintConfig, Severity } from '../types';

const CONFIG_FILENAMES = ['.PascalLint.json', '.pascallintrc', '.pascallintrc.json'];

/**
 * Load PascalLint configuration for a specific workspace.
 * P0-2: Supports multiple workspaces by taking workspace path as parameter.
 */
export async function loadConfigForWorkspace(
    workspacePath: string
): Promise<Record<string, Severity | [Severity, Record<string, unknown>]>> {
    for (const filename of CONFIG_FILENAMES) {
        const configPath = path.join(workspacePath, filename);
        if (fs.existsSync(configPath)) {
            try {
                const content = fs.readFileSync(configPath, 'utf8');
                const config: PascalLintConfig = JSON.parse(content);
                return mergeWithDefaults(config.rules || {});
            } catch (error) {
                // Invalid config file, log and continue
                console.warn(`PascalLint: Failed to parse config at ${configPath}:`, error);
            }
        }
    }

    // Return default configuration
    return getDefaultRules();
}

/**
 * Legacy loadConfig for backward compatibility.
 * @deprecated Use loadConfigForWorkspace instead.
 */
export async function loadConfig(
    basePath?: string
): Promise<Record<string, Severity | [Severity, Record<string, unknown>]>> {
    if (basePath) {
        return loadConfigForWorkspace(basePath);
    }
    return getDefaultRules();
}

/**
 * Get default rule configuration.
 * Includes all 14 implemented rules.
 */
export function getDefaultRules(): Record<string, Severity> {
    return {
        // Potential Errors
        'no-with': 'error',
        'no-semicolon-before-else': 'error',
        'dangling-semicolon': 'error',
        'no-empty-finally': 'warn',
        'unreachable-code': 'error',
        'constructor-call-on-instance': 'error',
        'no-exit-in-finally': 'error',

        // Best Practices
        'empty-begin-end': 'warn',
        'use-free-and-nil': 'warn',
        'check-assigned': 'info',

        // Stylistic Issues
        'pascal-case': 'warn',
        'one-var-per-line': 'info',
        'camel-case': 'off', // Off by default as it's too strict
        'upper-case-keywords': 'off', // Off by default, user preference
    };
}

/**
 * Merge user config with defaults.
 */
function mergeWithDefaults(
    userRules: Record<string, Severity | [Severity, Record<string, unknown>]>
): Record<string, Severity | [Severity, Record<string, unknown>]> {
    const defaults = getDefaultRules();
    return { ...defaults, ...userRules };
}

/**
 * Write default config file to disk.
 */
export function initConfig(targetPath: string): void {
    const config: PascalLintConfig = {
        rules: getDefaultRules(),
        parserOptions: {
            delphiVersion: 'xe',
        },
        ignorePatterns: ['**/node_modules/**', '**/out/**', '**/__history/**'],
    };

    const configPath = path.join(targetPath, '.PascalLint.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
}
