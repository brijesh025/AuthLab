const { initialize } = require('./database/sqlite');
const { registerAcrossModels } = require('./services/registration');
const { ask, createReadline } = require('./ui/input');

async function main() {
  await initialize();
  const rl = createReadline();
  console.log('AuthLab — authentication model comparison');
  console.log('1) Registration comparison');
  console.log('2) Authentication (next phase)');
  const choice = (await ask(rl, 'Choose an option: ')).trim();
  try {
    if (choice === '1') {
      const userId = (await ask(rl, '\nUnique user id: ')).trim();
      const password = await ask(rl, 'Password (hidden): ', true);
      await registerAcrossModels(userId, password);
    } else if (choice === '2') {
      console.log('\nAuthentication is scaffolded for the next phase. No message was stored.');
    } else {
      console.log('\nPlease choose 1 or 2.');
    }
  } catch (error) {
    console.error('\nRegistration cancelled:', error.message);
  } finally {
    rl.close();
  }
}

main();
