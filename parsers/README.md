# Tree-sitter Pascal WASM

This directory contains the Tree-sitter Pascal grammar compiled to WebAssembly.

## How to obtain

The `tree-sitter-pascal.wasm` file can be obtained by compiling the Tree-sitter Pascal grammar:

```bash
# Clone the grammar repository
git clone https://github.com/AntiBuzzlightyear/tree-sitter-pascal.git

# Install tree-sitter CLI
npm install -g tree-sitter-cli

# Build WASM
cd tree-sitter-pascal
tree-sitter build --wasm

# Copy the generated .wasm file here
cp tree-sitter-pascal.wasm /path/to/PascalLint/parsers/
```

## Alternative: Pre-built

You can also download pre-built WASM files from:
- https://github.com/AntiBuzzlightyear/tree-sitter-pascal/releases

Place the `tree-sitter-pascal.wasm` file in this directory for the extension to work.
