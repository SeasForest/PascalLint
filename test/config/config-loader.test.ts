import { loadConfig, getDefaultRules, initConfig } from '../../src/config';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Config Loader', () => {
    describe('getDefaultRules', () => {
        it('should return default rules', () => {
            const rules = getDefaultRules();

            expect(rules['no-with']).toBe('error');
            expect(rules['empty-begin-end']).toBe('warn');
            expect(rules['no-semicolon-before-else']).toBe('error');
        });
    });

    describe('loadConfig', () => {
        it('should return defaults when no config file exists', async () => {
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pascallint-test-'));

            const config = await loadConfig(tempDir);

            expect(config['no-with']).toBe('error');

            // Cleanup
            fs.rmSync(tempDir, { recursive: true });
        });

        it('should merge user config with defaults', async () => {
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pascallint-test-'));
            const configPath = path.join(tempDir, '.PascalLint.json');

            fs.writeFileSync(configPath, JSON.stringify({
                rules: {
                    'no-with': 'off',
                    'custom-rule': 'error',
                },
            }));

            const config = await loadConfig(tempDir);

            expect(config['no-with']).toBe('off');
            expect(config['custom-rule']).toBe('error');
            expect(config['empty-begin-end']).toBe('warn'); // From defaults

            // Cleanup
            fs.rmSync(tempDir, { recursive: true });
        });
    });

    describe('initConfig', () => {
        it('should create config file', () => {
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pascallint-test-'));

            initConfig(tempDir);

            const configPath = path.join(tempDir, '.PascalLint.json');
            expect(fs.existsSync(configPath)).toBe(true);

            const content = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            expect(content.rules).toBeDefined();
            expect(content.parserOptions).toBeDefined();

            // Cleanup
            fs.rmSync(tempDir, { recursive: true });
        });
    });
});
