// @getclickfix/react-native and @getclickfix/expo: what the Node
// test runner can check without a React Native runtime. The hooks and
// screens themselves run under jest (react-native preset): `pnpm test:native`.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
const code=(src)=>src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'').replace(/`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"/g,'""');
const pkg=async(name)=>JSON.parse(await readFile(new URL(`../${name}/package.json`,import.meta.url),'utf8'));
const walk=async(dir)=>(await readdir(dir,{withFileTypes:true,recursive:true})).filter((e)=>e.isFile()&&e.name.endsWith('.js')).map((e)=>`${e.parentPath}/${e.name}`);

for (const name of ['react-native','expo']) {
 test(`${name}: dist uses no browser API (Hermes safe), compiles without the DOM lib and ships metadata for the public mirror`,async()=>{
  for (const f of await walk(new URL(`../${name}/dist`,import.meta.url).pathname)) {
   const src=code(await readFile(f,'utf8'));
   for (const bad of [/\bwindow\b/,/\bdocument\b/,/\bnavigator\b/,/\blocalStorage\b/,/\bsessionStorage\b/,/\blocation\b/,/\bURLSearchParams\b/,/\bXMLHttpRequest\b/,/\bnew URL\(/])assert.ok(!bad.test(src),`${f} uses ${bad}`);
   assert.ok(!/require\(/.test(src),`${f} is not ESM`);
  }
  const tsconfig=JSON.parse(await readFile(new URL(`../${name}/tsconfig.json`,import.meta.url),'utf8'));
  assert.deepEqual(tsconfig.compilerOptions.lib,['ES2022']);assert.deepEqual(tsconfig.compilerOptions.types,[]);
  const p=await pkg(name);
  assert.equal(p.name,`@getclickfix/${name}`);assert.match(p.version,/^\d+\.\d+\.\d+$/);assert.equal(p.license,'MIT');assert.equal(p.type,'module');
  assert.equal(p.repository.url,'git+https://github.com/ClickSolveMainTR/clickfix-sdks.git');assert.equal(p.repository.directory,name);
  assert.equal(p.bugs.url,'https://github.com/ClickSolveMainTR/clickfix-sdks/issues');assert.equal(p.publishConfig.access,'public');
  assert.deepEqual(p.files,['dist','README.md','CHANGELOG.md']);
  for (const [sub,entry] of Object.entries(p.exports)) {
   assert.equal(entry.types.replace(/\.d\.ts$/,'.js'),entry.import,`${sub} types and import point at the same module`);
   await readFile(new URL(`../${name}/${entry.import}`,import.meta.url));await readFile(new URL(`../${name}/${entry.types}`,import.meta.url));
  }
  const changelog=await readFile(new URL(`../${name}/CHANGELOG.md`,import.meta.url),'utf8');
  assert.ok(changelog.includes(`## ${p.version}`),`CHANGELOG.md has a ${p.version} entry`);
  assert.equal(await readFile(new URL(`../${name}/LICENSE`,import.meta.url),'utf8'),await readFile(new URL('../LICENSE',import.meta.url),'utf8'),'LICENSE is the sdks/LICENSE copy');
 });
}

test('react-native: only react, react-native and the optional keychain are peers; expo wraps react-native and lists the Expo modules',async()=>{
 const rn=await pkg('react-native');
 assert.deepEqual(Object.keys(rn.peerDependencies).sort(),['react','react-native','react-native-keychain']);
 assert.deepEqual(rn.peerDependenciesMeta,{'react-native-keychain':{optional:true}});
 assert.deepEqual(Object.keys(rn.dependencies),['@getclickfix/visitor-core']);
 assert.deepEqual(Object.keys(rn.exports),['.','./ui']);
 const expo=await pkg('expo');
 assert.deepEqual(Object.keys(expo.dependencies),['@getclickfix/react-native']);
 assert.deepEqual(Object.keys(expo.peerDependencies).sort(),['expo','expo-constants','expo-file-system','expo-linking','expo-secure-store','react','react-native']);
 // The Expo package re-exports the whole React Native surface, so apps import one package.
 const index=await readFile(new URL('../expo/dist/index.js',import.meta.url),'utf8');
 assert.match(index,/export \* from '@getclickfix\/react-native'/);
 // The core's app mode is the only transport: no fetch of our own, no Origin.
 const provider=await readFile(new URL('../react-native/dist/provider.js',import.meta.url),'utf8');
 assert.match(provider,/mode: 'app'/);assert.ok(!/Origin/.test(provider));
});
