import { Injectable } from "@nestjs/common";
import { DateService } from "../dateService";

@Injectable()
export class processorGroupSelectionForCloudService {
  constructor(private dateService:DateService){

  }
  getProcessorGroupArrayForCloudStorage() {
    const currentDate:Date = this.dateService.getCurrentISTTime()
    const cronExpr = this.dateService.getCronExpression(currentDate);
    if (process.env.STORAGE_TYPE === "oracle") {
      return [
        { processor_group_name: "Run_adapters", scheduled_at: "0 */7 * * * ?" },
        {
          processor_group_name: "onestep_dataingestion_oracle",
          scheduled_at: `${cronExpr}`,
        },
      ];
    } else if (process.env.STORAGE_TYPE == "local") {
      return [
        { processor_group_name: "Run_adapters", scheduled_at: "0 */7 * * * ?" },
        {
          processor_group_name: "onestep_dataingestion_local",
          scheduled_at: `${cronExpr}`,
        },
      ];
    } else if (process.env.STORAGE_TYPE === "aws") {
      return [
        { processor_group_name: "Run_adapters", scheduled_at: "0 */7 * * * ?" },
        {
          processor_group_name: "onestep_dataingestion_aws",
          scheduled_at: `${cronExpr}`,
        },
      ];
    } else {
      return [
        { processor_group_name: "Run_adapters", scheduled_at: "0 */7 * * * ?" },
        {
          processor_group_name: "onestep_dataingestion_azure",
          scheduled_at: `${cronExpr}`,
        },
      ];
    }
  }
}
