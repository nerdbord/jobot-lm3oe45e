import schedule from 'node-schedule';
import { exec } from 'child_process';

export class Bot {
  private cronJob: schedule.Job | null = null;

  constructor() {
    this.setupCronJob();
  }

  runNpmCommand(searchValue: string, amount: number) {
    const command = `ts-node ./src/scripts/findOffers.ts -s "${searchValue}" -l ${amount}`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Error: ${stderr}`);
        return;
      }
      console.log(`Success: ${stdout}`);
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
