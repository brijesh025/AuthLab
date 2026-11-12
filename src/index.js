const { initialize } = require('./database/sqlite');
const { registerAcrossModels } = require('./services/registration');
const { authenticateAcrossModels } = require('./services/authentication');
const { ask, createReadline } = require('./ui/input');

async function registrationMenu(rl) {
  const userId = (await ask(rl, '\nUnique user id (or B to go back): ')).trim();
  if (!userId || userId === '__EOF__' || userId.toLowerCase() === 'b' || userId.toLowerCase() === 'back') return;
  const password = await ask(rl, 'Password (hidden, or B to go back): ', true);
  if (!password || password === '__EOF__' || password.toLowerCase() === 'b' || password.toLowerCase() === 'back') return;
  await registerAcrossModels(userId, password);
  console.log('\nReturning to the main menu. The three operation CLIs remain open until Enter is pressed in each one.');
}

async function authenticationMenu(rl) {
  const userId = (await ask(rl, '\nUser id (or B to go back): ')).trim();
  if (!userId || userId === '__EOF__' || ['b', 'back'].includes(userId.toLowerCase())) return;
  const password = await ask(rl, 'Password (hidden, or B to go back): ', true);
  if (!password || password === '__EOF__' || ['b', 'back'].includes(password.toLowerCase())) return;
  const message = (await ask(rl, 'Message to store after successful authentication (or B to go back): ')).trim();
  if (!message || ['b', 'back'].includes(message.toLowerCase())) return;
  await authenticateAcrossModels(userId, password, message);
  console.log('\nReturning to the main menu. The three authentication CLIs remain open until Enter is pressed in each one.');
}

async function main() {
  await initialize();
  const rl = createReadline();
  let running = true;
  try {
    while (running) {
      console.log('\n========================================');
      console.log('AuthLab — authentication model comparison');
      console.log('1) Registration comparison');
      console.log('2) Authentication');
      console.log('3) Exit');
      const choice = (await ask(rl, 'Choose an option: ')).trim().toLowerCase();
      if (choice === '__eof__') { running = false; continue; }
      try {
        if (choice === '1' || choice === 'register' || choice === 'registration') await registrationMenu(rl);
        else if (choice === '2' || choice === 'authenticate' || choice === 'authentication') await authenticationMenu(rl);
        else if (choice === '3' || choice === 'exit' || choice === 'q' || choice === 'quit') {
          running = false;
          console.log('\nGoodbye.');
        } else console.log('\nInvalid option. Choose 1, 2, or 3.');
      } catch (error) {
        console.error('\nOperation cancelled:', error.message);
        await ask(rl, 'Press Enter to return to the main menu... ');
      }
    }
  } finally { rl.close(); }
}

main().catch((error) => { console.error('\nFatal error:', error.message); process.exitCode = 1; });
