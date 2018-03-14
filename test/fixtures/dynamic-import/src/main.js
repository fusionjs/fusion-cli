export default function main() {
  return import('./dynamic.js').then(dynamicImport =>
    console.log(dynamicImport.default())
  );
}

main();
