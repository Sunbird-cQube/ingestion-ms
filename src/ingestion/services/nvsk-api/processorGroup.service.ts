import { Injectable } from "@nestjs/common";

@Injectable()
export class processorGroupSelectionForCloudService {
  getProcessorGroupArrayForCloudStorage() {
    if (process.env.STORAGE_TYPE === "oracle") {
      return [
        { processor_group_name: "Run_adapters", scheduled_at: "0 */7 * * * ?" },
        {
          processor_group_name: "onestep_dataingestion_oracle",
          scheduled_at: "0 */9 * * * ?",
        },
      ];
    } else if (process.env.STORAGE_TYPE == "local") {
      return [
        { processor_group_name: "Run_adapters", scheduled_at: "0 */7 * * * ?" },
        {
          processor_group_name: "onestep_dataingestion_local",
          scheduled_at: "0 */9 * * * ?",
        },
      ];
    } else if (process.env.STORAGE_TYPE === "aws") {
      return [
        { processor_group_name: "Run_adapters", scheduled_at: "0 */7 * * * ?" },
        {
          processor_group_name: "onestep_dataingestion_aws",
          scheduled_at: "0 */9 * * * ?",
        },
      ];
    } else {
      return [
        { processor_group_name: "Run_adapters", scheduled_at: "0 */7 * * * ?" },
        {
          processor_group_name: "onestep_dataingestion_azure",
          scheduled_at: "0 */9 * * * ?",
        },
      ];
    }
  }
}
