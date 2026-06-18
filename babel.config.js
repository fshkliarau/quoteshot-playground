module.exports = function (api) {
  api.cache(true);

  // DialKit's prebuilt bundle contains `import.meta` (in `typeof import.meta` /
  // `import.meta.env` guards). Metro emits classic, non-module scripts, where
  // `import.meta` is a parse-time SyntaxError that kills the whole bundle.
  // Replace every `import.meta` with `{}` — the guards stay correct and the
  // bundle parses. (Runs on node_modules too, since Metro babel-transforms them.)
  const stripImportMeta = ({ types: t }) => ({
    name: 'strip-import-meta',
    visitor: {
      MetaProperty(path) {
        const n = path.node;
        if (n.meta && n.meta.name === 'import' && n.property && n.property.name === 'meta') {
          path.replaceWith(t.objectExpression([]));
        }
      },
    },
  });

  return {
    presets: ['babel-preset-expo'],
    plugins: [stripImportMeta],
  };
};
