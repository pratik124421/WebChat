
export class ChatMessageModel {
    public author: MsgAuthor;
    public msgBody: any;
    public msgType: MsgType;
    public timestamp: string;
    public msgText: string;
    public isOptionsDisable:boolean
    
    public _isDelivered:boolean
    public _isPending:boolean
    
    private _isAckPending: boolean;

    get isPending() {
      return this._isPending;
  }

  get isDelivered() {
    return this._isDelivered;
  }

  get isAckPending() {
    return this._isAckPending;
  }

    
    formatTime(time: Date) {
        let hours: number = time.getHours();
        let ampm: string = (hours >= 12) ? 'pm' : 'am';
        let minutes: number = time.getMinutes();
        let fMins: string = (minutes < 10) ? `0${minutes}` : minutes.toString();

        // the hour '0' should be '12'
        hours = (hours % 12) ? (hours % 12) : 12;

        return `${hours}:${fMins} ${ampm}`;
    }


    private setAckPendingStatus(status: boolean) {
      this._isAckPending = status;
      this._isPending = status;
  }

    public acknowledgeMsg(status: boolean) {
      this.setAckPendingStatus(false);

        this._isDelivered = true
        setTimeout(()=>this._isDelivered=false,10000)

    }

    public disableOptions(){
      this.isOptionsDisable = true
    }

    public getOptionStatus(){
      return this.isOptionsDisable
    }



    constructor(sender: MsgAuthor, body: any, type: MsgType, time: Date,isAckPending?: boolean) {
      // TODO: provide the arr-idx to the platform and make sure it reverts back.
      // Will be used in the functionality of brightening the "POST-success" user message.
      // this.msgId = id;
      // this.arrIdx = id;

      this.author = sender;
      this.msgBody = body;
      this.msgText = body;
      this.msgType = type;
      this.timestamp = this.formatTime(time);
      this.isOptionsDisable = false
    
      
    if (sender == MsgAuthor.Bot && type == MsgType.Text) {
        this.msgBody = body
        console.log(" ** Decorated Text: ", this.msgBody);
      }

      if (!isAckPending) {
        this.setAckPendingStatus(isAckPending);
      } else {
        this.setAckPendingStatus(sender == MsgAuthor.User);
      }
    }
}


export enum MsgType {
    Text = "Text",
    ChoicePrompt = "ChoicePrompt",
    AdaptiveCard = "AdaptiveCard",
    ShowCategory="ShowCategory"
    
}


export enum MsgAuthor {
    Bot = "Bot",
    User = "User"
}