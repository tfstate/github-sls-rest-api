import { convertFromDirectory } from 'joi-to-typescript';

async function types(): Promise<void> {
  console.log('Running joi-to-typescript...');

  const result = await convertFromDirectory({
    schemaDirectory: './src/models/schemas',
    typeOutputDirectory: './src/models/interfaces',
  });

  if (result) {
    console.log('Completed joi-to-typescript');
  } else {
    console.log('Failed to run joi-to-typescript');
  }
}

(async () => {
  try {
    await types();
  } catch (e: any) {
    console.warn('Error generating types', e.message);
  }
})();
