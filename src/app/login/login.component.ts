import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DirectLineService } from 'src/Services/DirectlineService';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  constructor(
    private DirectlineObj: DirectLineService,
    private router : Router
  ) { }

  ngOnInit(): void {
    this.generateToken()
  }

  public generateToken(){
    this.DirectlineObj.generateDirectLineToken().subscribe(
      (data:any) => {
        this.router.navigate(["/chatbox"], {
          queryParams: {"token":data.token} 
        })
        },
      (err) => {
        console.log("[GenerateDirectLineToken - Error]: ", err);
      }
    );
  }

}
