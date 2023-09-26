import schedule from 'node-schedule';
import { exec } from 'child_process';

export class Bot {
  private cronJob: schedule.Job | null = null;

  constructor() {
    this.setupCronJob();
  }
  //
  runNpmCommand(searchValue: string, amount: number) {
    const command = `npm run scrap:offers -- -s "${searchValue}" -l ${amount}`;
    const childProcess = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        return;
      }
      console.log(`Success: ${stdout}`);
    });
    childProcess.on('exit', (code) => {
      if (code === 0) {
        console.log('Zapisano pliki.');
      } else {
        console.error(`Błąd podczas zapisywania plików. Kod wyjścia: ${code}`);
      }
    });
  }

  setupCronJob() {
    this.cronJob = schedule.scheduleJob('0 9 * * 1-5', () => {
      console.log('Uruchamiam komendę...');
      this.runNpmCommand('javascript developer', 30);
    });
  }
}
new Bot();
