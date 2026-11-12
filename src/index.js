const { initialize } = require('./database/sqlite');
const { registerAcrossModels } = require('./services/registration');
const { authenticateAcrossModels } = require('./services/authentication');
const { passwordGuessingAttack, replayAttack, messageTamperingAttack, databaseLeakAttack } = require('./services/attacks');
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
  console.log('\nAuthentication options:');
  console.log('1) Normal authentication and store a message');
  console.log('2) Attack lab');
  console.log('3) Back');
  const action = (await ask(rl, 'Choose an authentication option: ')).trim().toLowerCase();
  if (action === '3' || action === 'b' || action === 'back') return;
  if (action === '2' || action === 'attack' || action === 'attacks') return attackMenu(rl);
  if (action !== '1' && action !== 'normal') { console.log('\nInvalid authentication option.'); return; }
  const userId = (await ask(rl, '\nUser id (or B to go back): ')).trim();
  if (!userId || userId === '__EOF__' || ['b', 'back'].includes(userId.toLowerCase())) return;
  const password = await ask(rl, 'Password (hidden, or B to go back): ', true);
  if (!password || password === '__EOF__' || ['b', 'back'].includes(password.toLowerCase())) return;
  const message = (await ask(rl, 'Message to store after successful authentication (or B to go back): ')).trim();
  if (!message || ['b', 'back'].includes(message.toLowerCase())) return;
  await authenticateAcrossModels(userId, password, message);
  console.log('\nReturning to the main menu. The three authentication CLIs remain open until Enter is pressed in each one.');
}

async function attackMenu(rl) {
  console.log('\nAttack lab:');
  console.log('1) Bounded password-guessing attack');
  console.log('2) Credential replay attack');
  console.log('3) Message-tampering attack');
  console.log('4) Database-leak comparison');
  console.log('5) Back');
  const choice = (await ask(rl, 'Choose an attack: ')).trim().toLowerCase();
  if (choice === '5' || choice === 'b' || choice === 'back') return;
  if (!['1', '2', '3', '4', 'guess', 'password', 'replay', 'tamper', 'leak'].includes(choice)) { console.log('\nInvalid attack option.'); return; }
  const userId = (await ask(rl, '\nTarget user id: ')).trim();
  if (!userId || ['b', 'back'].includes(userId.toLowerCase())) return;
  if (choice === '1' || choice === 'guess' || choice === 'password') {
    const message = (await ask(rl, 'Message to store if the password is guessed: ')).trim();
    if (!message || ['b', 'back'].includes(message.toLowerCase())) return;
    await passwordGuessingAttack(userId, message);
  } else if (choice === '2' || choice === 'replay') {
    const password = await ask(rl, 'Captured password/credential for replay test: ', true);
    if (!password || password === '__EOF__') return;
    const message = (await ask(rl, 'Replay message: ')).trim(); if (!message) return;
    await replayAttack(userId, password, message);
  } else if (choice === '3' || choice === 'tamper') {
    const message = (await ask(rl, 'Replacement message written by the attacker: ')).trim(); if (!message) return;
    await messageTamperingAttack(userId, message);
  } else {
    await databaseLeakAttack(userId);
  }
  console.log('\nReturning to the main menu.');
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
