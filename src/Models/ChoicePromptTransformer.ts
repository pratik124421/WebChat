import { MsgType } from "./ChatMessageModel";

export class ChoicePromptTransformer {
  public text: string ;
  public choices: Array<any> = [];
  public selectedOption: number;
  public isOptionsEnabled: boolean = true;
  public Type: string;

  private ParseChoicePrompt(rawdata: any) {
    console.log("ChoiceCardModel ~ parsePromptAndInit ~ rawdata", rawdata);
    this.text = rawdata.message
    this.choices = rawdata.rawData.split("|");
  }

  SetSelectedOption(idx: number) {
    this.selectedOption = idx;
  }

  private ParseChoiceCard(rawdata : any){
    console.log("ChoiceCardModel ~ ParseChoiceCard ~ rawdata", rawdata);
    this.text = rawdata[0].content.body[0].text
    for(let i of rawdata[0].content.body[1].actions){
      this.choices.push(i)
    }
  }

  constructor(message: any, type: string = "ChoicePrompt") {
        this.Type = type;
        if(type == "ChoicePrompt"){
          this.ParseChoicePrompt(message.channelData);
        }
        else if(type == MsgType.ShowCategory){
          if(message.attachments){
            this.ParseChoiceCard(message.attachments)
          }
        }
      }
}
