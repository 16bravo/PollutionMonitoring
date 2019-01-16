import { Component, OnInit, Input } from '@angular/core';
import { MyServiceService } from './services/my-service.service';
import { DatePipe } from '@angular/common';

import * as L from 'leaflet';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Mobile Air Monitoring';
  dateMesB: any;
  dateMes: string;
  mymap: any;
  myIcon: any;
  polluant: String;
  nomStation: String;
  detailsHTML: any = 0;
  gaz: any;

  constructor(private datePipe: DatePipe, private myService: MyServiceService) { }
  sensorTab: string[];
  
  ngOnInit() {
    // Déclaration de la carte avec les coordonnées du centre et le niveau de zoom.
    this.mymap = L.map('map').setView([43.6111634, 1.43], 12);
    this.polluant = "CO"; //par defaut ozone pour l'instant   
    this.detailsHTML += 1;
    this.dateMesB = this.datePipe.transform(Date.now(), 'yyyy-MM-dd');
    this.dateMes = this.datePipe.transform(Date.now(), 'yyyy-MM-dd');

    //recuperation des donnees JSON dans un tableau sensorTab
    this.myService.getData((res)=>{
      this.sensorTab = res;
      //console.log(this.sensorTab);
      this.afficherCarte();
    }); 
  }

  afficherCarte () {
    let icon;
    let dateMes2 = this.dateMes;
    let mymap = this.mymap;
    let polluant = this.polluant;
    let tab = this.sensorTab;
    
    //tableaux contenant les differents niveaux de concentration de polluant du plus dangereux au moins dangereux
    var nivOzone = [180,120,50];
    var nivPm10 = [50,40,15];

    //reinitialisation de la carte
    mymap.eachLayer(function (layer) {
    mymap.removeLayer(layer);
    });
    
    //chargement de la carte
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: 'Map'
    }).addTo(this.mymap);

    //placement des markers a partir du tableau sensorTab
    this.sensorTab.forEach(function (value) {
      //console.log(value["metadata"].time);
      //console.log(dateMes2);
      console.log(value["payload_fields"]);
    let nivTab = nivOzone;
      if (value["metadata"].time.substring(0, 10) == dateMes2) {
        console.log(value["metadata"]["time"]);
        //niveaux de concentration d'ozone
        if(polluant=="CO"){
          nivTab = nivOzone;
          polluant = "co"
        }else if(polluant == "PM10"){
          nivTab = nivPm10;
          polluant = "ppm10";
        }else if(polluant == "PM25"){
          nivTab = nivPm10;
          polluant = "ppm2_5";
        }else if(polluant == "NH3"){
          nivTab = nivPm10;
          polluant = "nh3";
        }else if(polluant == "NO2"){
          nivTab = nivPm10;
          polluant = "no2";
        };
        let val = parseInt(value["payload_fields"][polluant]);
        console.log("value is "+val);
          if(val > nivTab[0]){icon="icon4"}else if(val > nivTab[1]){icon="icon3"}else if(val > nivTab[2]){icon="icon2"}else{icon="icon1"};
          //tableau contenant des infos pour chaque capteur [nom_capteur,coordonnéesX,coordonéesY, nom station]
          let dataSensor = [["arduino","43.57","1.47","INSA Toulouse"],["lopy1","43.58","1.48","INSA Toulouse 2"],["lopy3","43.64","1.49","A68"],["lopy4n2","43.60","1.44","Capitole"]];
          let x;
          let y;
          let station;
          //ajout du marqueur
          for(var i=0;i<dataSensor.length;i++){
            if(dataSensor[i][0]==value["dev_id"]){
                x = dataSensor[i][1];
                y = dataSensor[i][2];
                station = dataSensor[i][3];
            };
          }

          //definition du texte à afficher
          let html = "<b>"+station+"</b></br>"+polluant+"</br>"+val+" ug.m-3";
          
          L.marker([x, y], {icon: L.icon({iconUrl: 'assets/'+icon+'-sm.png'}), title: value["dev_id"]}).bindPopup(html).addTo(mymap).on('click',details);
            
      };
    })

  //affichage des details lors du clique sur un marqueur (code Javascript)
  function details(e){
    //affichage du tableau des données pour un capteur précis
    var el = document.getElementById("tableau");
    var el2 = document.getElementById("nomStation");
    el.innerHTML="";
    //el.DataTable();
    var dps = [];
    var dpsPm10 = [];

    el2.innerHTML=e.sourceTarget.options.title;
    var table="<table class=\"table-reponsive-md\"><tr><th>CO</th><th>Humidité</th><th>NH3</th><th>NO2</th><th>PPM 2.5</th><th>PPM 10</th><th>Pression</th><th>Température</th><th>date</th><th>time</th></tr>";
        for(var i=0;i<tab.length;i++)
    {
      if(tab[i]["dev_id"]==e.sourceTarget.options.title){
      table+="<tr><td>"+tab[i]["payload_fields"]["co"]+"</td><td>"+tab[i]["payload_fields"]["humidity"]+"</td><td>"+tab[i]["payload_fields"]["nh3"]+"</td><td>"+tab[i]["payload_fields"]["no2"]+"</td><td>"+tab[i]["payload_fields"]["ppm2_5"]+"</td><td>"+tab[i]["payload_fields"]["ppm10"]+"</td><td>"+tab[i]["payload_fields"]["pressure"]+"</td><td>"+tab[i]["payload_fields"]["temperature"]+"</td><td>"+tab[i]["metadata"]["time"].substring(0, 10)+"</td><td>"+tab[i]["metadata"]["time"].substring(11, 16)+"</td><td>"+"</td></tr></table>";
      //données de concentration en ozone
     // if(tab[i]["polluant"]=="O3"){
      dps.push({
        x: Date.parse(tab[i]["metadata"]["time"]),
        y: parseFloat(tab[i]["payload_fields"]["co"])
      })
    //}
   // if(tab[i]["polluant"]=="PM10"){
      dpsPm10.push({
        x: Date.parse(tab[i]["metadata"]["time"]),
        y: parseFloat(tab[i]["payload_fields"]["nh3"])
      })
   // }
    }
    }
    el.innerHTML+=table+"</table>";

    function compareDataPointX(dataPoint1, dataPoint2) {
      return dataPoint1.x - dataPoint2.x;
    }

    //génération d'un graphique de données
    var chart = new CanvasJS.Chart("chartContainer", { //ignorez l'erreur, c'est juste qu'on inclut du JS dans du TS
      animationEnabled: true,
      title: {
        text: "Pollutant concentration"
      },
      theme: "light1",
      axisX: {
        title: "Time"
      },
      axisY: {
        title: "Taux",
        suffix: "µg/m-3"
      },
      data: [{
        type: "line",
        name: "Concentration en ozone",
        connectNullData: true,
        //nullDataLineDashType: "solid",
        xValueType: "dateTime",
        xValueFormatString: "DD MMM hh:mm TT",
        yValueFormatString: "#,##0.##\"ug.m-3\"",
        dataPoints: dps
      },
      {
        type: "line",
        color: "red",
        name: "Concentration en PM10",
        connectNullData: true,
        xValueType: "dateTime",
        xValueFormatString: "DD MMM hh:mm TT",
        yValueFormatString: "#,##0.##\"ug.m-3\"",
        dataPoints: dpsPm10
      }]
    });
    chart.options.data[0].dataPoints.sort(compareDataPointX);//order by asc date
    chart.options.data[1].dataPoints.sort(compareDataPointX);//order by asc date
    chart.render();
  }
  }

  //Mise a jour de la date par rapport a la selection
  onDateChanged(): void {
    this.dateMes = this.datePipe.transform(this.dateMesB, 'yyyy-MM-dd');
    this.afficherCarte();
  }

  //Mise a jour du polluant par rapport a la selection
  //Ai fait 2 fonctions pour les phases de test mais peut (doit?) etre reduit
  o3(){
    this.polluant="O3";
    this.afficherCarte();
  }

  pm10(){
    this.polluant="PM10";
    this.afficherCarte();
  }  

  pm25(){
    this.polluant="PM25";
    this.afficherCarte();
  }

  nh3(){
    this.polluant="NH3";
    this.afficherCarte();
  }

  co(){
    this.polluant="CO";
    this.afficherCarte();
  }

  no2(){
    this.polluant="NO2";
    this.afficherCarte();
  }
  
}
