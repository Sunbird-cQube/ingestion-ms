import { Injectable } from "@nestjs/common";
@Injectable()
export class DateService {
  getCurrentISTTime():Date {
    const now = new Date();
    const istOffset = 330 * 60 * 1000; 

    const currentISTTime = new Date(now.getTime() + istOffset);

    return currentISTTime;
  }

  getCronExpression(currentISTTime: Date):string {
    const hours = currentISTTime.getUTCHours();
    const minutes = currentISTTime.getUTCMinutes();

    const scheduledMinutes = (minutes + 9) % 60;
    const scheduledHours = hours + Math.floor((minutes + 9) / 60);
    const cronExpression = `0 ${scheduledMinutes} ${scheduledHours} * * ?`;

    return cronExpression;
  }
}
