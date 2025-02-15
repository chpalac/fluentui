import { stripIndents, Tree, updateJson, generateFiles, joinPathFragments } from '@nrwl/devkit';
import * as path from 'path';

import { PackageJson, TsConfig } from '../../../types';
import { getProjectConfig } from '../../../utils';
import { uniqueArray } from './utils';

const templates = {
  config: stripIndents`
    import { baseConfig } from '@fluentui/scripts-cypress';

    export default baseConfig;
  `,
  tsconfig: {
    extends: './tsconfig.json',
    compilerOptions: {
      isolatedModules: false,
      types: ['node', 'cypress', 'cypress-storybook/cypress', 'cypress-real-events'],
      lib: ['ES2019', 'dom'],
    },
    include: ['**/*.cy.ts', '**/*.cy.tsx'],
  },
};

type Options = ReturnType<typeof getProjectConfig>;

export function addFiles(tree: Tree, options: Options) {
  generateFiles(tree, joinPathFragments(__dirname, '../files'), options.projectConfig.root, { tmpl: '' });

  updateJson(tree, options.paths.tsconfig.main, (json: TsConfig) => {
    json.references?.push({
      path: `./${path.basename(options.paths.tsconfig.cypress)}`,
    });

    return json;
  });

  // update lib ts with new exclude globs
  updateJson(tree, options.paths.tsconfig.lib, (json: TsConfig) => {
    json.exclude = json.exclude || [];
    json.exclude.push(...['**/*.cy.ts', '**/*.cy.tsx']);
    json.exclude = uniqueArray(json.exclude);

    return json;
  });

  updateJson(tree, options.paths.packageJson, (json: PackageJson) => {
    json.scripts = json.scripts ?? {};
    json.scripts.e2e = 'cypress run --component';
    json.scripts['e2e:local'] = 'cypress open --component';

    return json;
  });

  return tree;
}
