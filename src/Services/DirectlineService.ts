import { HttpClient } from "@angular/common/http";
import {DirectLine} from "botframework-directlinejs"
import { environment } from "src/Environment/environment";
import { Injectable } from '@angular/core';

@Injectable()
export class DirectLineService{
  
    // NOTE: The connection is not being generated using a token!
    createDirectlineConnection(dlToken: string) {
      let directLineObj = new DirectLine({
        secret: dlToken,
      });
      return directLineObj;
    }
  
  
    public generateDirectLineToken() {
        const url =
          "https://directline.botframework.com/v3/directline/tokens/generate";
        const opt = {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + environment.directLineSecret,
          },
        };
    
        console.log("[fetchAuthInfo] Querying login at: ", url);
        console.log("[fetchAuthInfo] Options: ", opt);
       return this._http.post(url, {}, opt);
      }
    
  
    constructor(
        private _http: HttpClient,
    ) { }
  
}