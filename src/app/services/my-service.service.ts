import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MyServiceService {

  constructor(private httpClient: HttpClient) { }

  /**
   * Return a test array object
   */
  getDataTest() {
    return [
      {"humidity":50, "temperature":50},
      {"humidity":0, "temperature":40},
      {"humidity":20, "temperature":30}
    ];
  }

  /**
   * Send a GET HTTP request to the NodeJS server
   * address : localhost
   * port : 3000
   * The callback function must have a parameter which represents
   * the result of the request
   * @param callback  the callback function to execute
   */
  getData(callback) {
    const url = "http://localhost:3000/query";

    // HTTP request GET
    this.httpClient
      .get(url)
      .subscribe(
        (res) => {
          //console.log(res);
          callback(res);
        },
        (error) => {
          console.log(error);
        }
      )
  }
}
