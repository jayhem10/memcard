const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const catalogs = Object.fromEntries(['fr', 'en'].map(locale => [
  locale, JSON.parse(fs.readFileSync(path.join(root, 'src/messages', `${locale}.json`), 'utf8')),
]));

function messageKeys(messages, prefix = '') {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === 'string' ? [prefix + key] : messageKeys(value, `${prefix}${key}.`));
}

test('French and English catalogs contain the same nonempty message keys', () => {
  assert.deepEqual(messageKeys(catalogs.fr).sort(), messageKeys(catalogs.en).sort());
  for (const [locale, catalog] of Object.entries(catalogs)) {
    for (const key of messageKeys(catalog)) {
      const value = key.split('.').reduce((node, segment) => node[segment], catalog);
      assert.ok(value.trim(), `${locale}: ${key} is empty`);
    }
  }
});

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : /\.tsx?$/.test(file) ? [file] : [];
  });
}

test('literal next-intl translation calls resolve in both languages', () => {
  const keys = Object.fromEntries(Object.entries(catalogs).map(([locale, catalog]) => [
    locale, new Set(messageKeys(catalog)),
  ]));
  const missing = [];
  for (const file of sourceFiles(path.join(root, 'src'))) {
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const bindings = new Map();
    function collect(node) {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
        const init = ts.isAwaitExpression(node.initializer) ? node.initializer.expression : node.initializer;
        if (ts.isCallExpression(init) && ts.isIdentifier(init.expression) &&
            ['useTranslations', 'getTranslations'].includes(init.expression.text)) {
          const arg = init.arguments[0];
          let namespace = '';
          if (arg && ts.isStringLiteral(arg)) namespace = arg.text;
          if (arg && ts.isObjectLiteralExpression(arg)) {
            const property = arg.properties.find(item => item.name?.getText(source) === 'namespace');
            if (property && ts.isPropertyAssignment(property) && ts.isStringLiteral(property.initializer)) {
              namespace = property.initializer.text;
            }
          }
          bindings.set(node.name.text, namespace);
        }
      }
      ts.forEachChild(node, collect);
    }
    collect(source);
    function check(node) {
      if (ts.isCallExpression(node)) {
        const translator = ts.isPropertyAccessExpression(node.expression) ? node.expression.expression : node.expression;
        const arg = node.arguments[0];
        if (ts.isIdentifier(translator) && bindings.has(translator.text) && arg &&
            (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg))) {
          const key = [bindings.get(translator.text), arg.text].filter(Boolean).join('.');
          for (const [locale, catalogKeys] of Object.entries(keys)) {
            if (!catalogKeys.has(key)) missing.push(`${path.relative(root, file)}: ${locale}.${key}`);
          }
        }
      }
      ts.forEachChild(node, check);
    }
    check(source);
  }
  assert.deepEqual(missing, []);
});
