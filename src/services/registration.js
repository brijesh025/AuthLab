const fs = require('node:fs');
const path = require('node:path');
const { exec, execFile, execFileSync, spawn } = require('node:child_process');
const { MODELS, DATA_DIR } = require('../config');
const { userExists } = require('../database/sqlite');

const WORKER = path.join(__dirname, '..', 'workers', 'registration-worker.js');
const ARRANGER = path.join(__dirname, '..', 'windows', 'arrange-windows.ps1');
function quote(value) { return `"${String(value)}"`; }
function screenGeometry() {
  try {
    const output = execFileSync('powershell.exe', ['-NoProfile', '-Command', 'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea | Select-Object Width,Height | ConvertTo-Json -Compress'], { encoding: 'utf8', windowsHide: true });
    const screen = JSON.parse(output); const width = Math.floor(screen.Width / 3);
    return { width, height: screen.Height, positions: [0, width, width * 2] };
  } catch (_) { return { width: 455, height: 900, positions: [0, 455, 910] }; }
}
function openWindowsCli(model, mode, inputFile, resultFile, index, geometry) {
  const title = `AuthLab - ${mode} - ${model.title}`;
  const workerArgs = [WORKER, mode, model.key, inputFile, resultFile];
  if (process.platform === 'win32') {
    const columns = Math.max(40, Math.floor(geometry.width / 8));
    const rows = Math.max(24, Math.floor(geometry.height / 16));
    spawn('wt.exe', ['-w', 'new', '--pos', `${geometry.positions[index]},0`, '--size', `${columns},${rows}`, 'new-tab', '--title', title, '--suppressApplicationTitle', 'cmd.exe', '/d', '/c', 'node', ...workerArgs], { windowsHide: false, detached: true, stdio: 'ignore' }).unref();
    return;
  }
  const command = ['start', quote(title), 'cmd.exe', '/d', '/c', 'node', quote(WORKER), mode, model.key, quote(inputFile), quote(resultFile)].join(' ');
  exec(command, { windowsHide: false }, (error) => { if (error) console.error(`Could not open ${model.title} CLI: ${error.message}`); }).unref();
}
function arrangeCliWindows(mode) {
  if (process.platform !== 'win32') return;
  const titles = MODELS.map((model) => `AuthLab - ${mode} - ${model.title}`);
  const timer = setTimeout(() => {
    const arranger = execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ARRANGER, '-Titles', ...titles], { windowsHide: true }, () => {});
    arranger.unref();
  }, 700);
  timer.unref();
}
function waitForResult(resultFile) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const check = () => {
      if (fs.existsSync(resultFile)) { try { const result = JSON.parse(fs.readFileSync(resultFile, 'utf8')); if (result.error) reject(new Error(result.error)); else resolve(result.result); } catch (error) { reject(error); } return; }
      if (Date.now() - started > 10 * 60 * 1000) { reject(new Error('A model CLI did not finish within 10 minutes.')); return; }
      setTimeout(check, 100);
    }; check();
  });
}
async function launchModelClis(mode, input) {
  const runDir = fs.mkdtempSync(path.join(DATA_DIR, `${mode}-`)); const inputFile = path.join(runDir, 'input.json'); fs.writeFileSync(inputFile, JSON.stringify(input));
  console.log(`\nOpening three independent ${mode} CLI windows...`);
  const geometry = screenGeometry();
  const jobs = MODELS.map((model, index) => { const resultFile = path.join(runDir, `${model.key}.json`); openWindowsCli(model, mode, inputFile, resultFile, index, geometry); return waitForResult(resultFile); });
  arrangeCliWindows(mode);
  let completed; try { completed = await Promise.all(jobs); } finally { fs.rmSync(runDir, { recursive: true, force: true }); }
  return Object.fromEntries(MODELS.map((model, index) => [model.key, completed[index]]));
}
async function registerAcrossModels(userId, password) {
  if (!userId || !password) throw new Error('User id and password are required.');
  for (const model of MODELS) if (userExists(model.key, userId)) throw new Error(`User id already exists in ${model.title}.`);
  const results = await launchModelClis('registration', { userId, password });
  console.log('\nAll three registration CLI windows completed.');
  console.table(MODELS.map((model) => ({ model: model.title, time_ms: Number(results[model.key].ms.toFixed(2)), database_bytes: results[model.key].bytes, stored: results[model.key].stored })));
  return results;
}
module.exports = { registerAcrossModels, launchModelClis };
