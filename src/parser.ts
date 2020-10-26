/* eslint-disable @typescript-eslint/no-use-before-define */
import fs from 'fs';
import YAML from 'yaml';
import prettier from 'prettier';
import * as OpenAPIV3 from './types/OpenAPIV3';
import './lib/array-extensions';
import { renderSchemaComponents } from './renderSchemaComponents';
import { sortMembers } from './sortMembers';
import { renderOperations } from './renderOperations';
import { getGeneratedDependencies } from './getGeneratedDependencies';
import { renderJsonTypes } from './renderJsonTypes';
import { renderParserTypes } from './renderParserTypes';
import { renderParserFunctions } from './renderParserFunctions';
import { renderCreateRequestUrl } from './renderCreateRequestUrl';

const loadYAML = (filename: string): OpenAPIV3.Document => {
  console.log(`Reading file ${filename} as YAML`);
  return YAML.parse(fs.readFileSync(filename, 'utf-8'));
};

const document = loadYAML('./src/example/openapiv3.yaml');

const generatedMembers = [
  ...renderJsonTypes(),
  ...renderParserTypes(),
  ...renderCreateRequestUrl(),
  ...renderParserFunctions(),
  ...renderSchemaComponents(document.components?.schemas),
  ...renderOperations(document)
];

const server = generatedMembers.find(
  m => 'name' in m && m.name === 'createServer'
);
if (!server) {
  throw new Error('Server not generated');
}
const dependencies = getGeneratedDependencies(server, generatedMembers);

const members = sortMembers(generatedMembers); //sortMembers([...dependencies, server]);

const rawOutput = [
  ...members.flatMap(m => m.imports).distinct(),
  ...members.compactMap(m => ('declaration' in m ? m.declaration : null))
].join('\n\n');

const formattedOutput = prettier.format(rawOutput, {
  parser: 'typescript',
  arrowParens: 'avoid',
  semi: true,
  trailingComma: 'none',
  singleQuote: true,
  printWidth: 80
});

fs.writeFileSync('./src/example/output.ts', formattedOutput);

console.log('Done');
