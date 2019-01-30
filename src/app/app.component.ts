import { Component, OnInit, Input } from '@angular/core';
import { MyServiceService } from './services/my-service.service';
import { DatePipe } from '@angular/common';
import * as CanvasJS from './canvasjs.min.js'

import * as L from 'leaflet';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Connected Air Quality Monitor';
  dateMesB: any;
  dateMes: string;
  mymap: any;
  myIcon: any;
  polluant: String;
  nomStation: String;
  detailsHTML: any = 0;
  gaz: any;
  clicked = true;

  iconCO: String;

  constructor(private datePipe: DatePipe, private myService: MyServiceService) { }
  sensorTab: string[];
  
  ngOnInit() {
    // Déclaration de la carte avec les coordonnées du centre et le niveau de zoom.
    this.mymap = L.map('map').setView([43.6111634, 1.43], 12);
    this.polluant = "co"; //par defaut ozone pour l'instant   
    this.detailsHTML += 1;
    this.dateMesB = this.datePipe.transform(Date.now(), 'yyyy-MM-dd');
    this.dateMes = this.datePipe.transform(Date.now(), 'yyyy-MM-dd')

    //recuperation des donnees JSON dans un tableau sensorTab
    this.myService.getData((res)=>{
      this.sensorTab = res;
      //console.log(this.sensorTab);
      this.afficherCarte();
    }); 
  }

  afficherCarte () {
    //INITIALISATION DES VARIABLES
    let icon;
    let dateMes2 = this.dateMes;
    let mymap = this.mymap;
    let polluant = this.polluant;
    let tab = this.sensorTab;
    
    //tableaux contenant les differents niveaux de concentration de polluant du plus dangereux au moins dangereux
    //https://www.airparif.asso.fr/reglementation/normes-francaises
    var nivOzone = [180,120,50];
    var nivCO = [100,75,40]; //4.68
    var nivPm10 = [50,40,15]; //3.8
    var nivPm25 = [25,20,10]; //2
    var nivNH3 = [70,60,30]; //0.53, je pense que l'unité est ppb
    var nivNO2 = [40,30,70]; //0.24

    //AFFICHAGE DE LA CARTE
    //reinitialisation de la carte
    mymap.eachLayer(function (layer) {
    mymap.removeLayer(layer);
    });
    
    //chargement de la carte
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: 'Map'
    }).addTo(this.mymap);

    //PLACEMENT DES MARKERS
    //placement des markers a partir du tableau sensorTab
    this.sensorTab.forEach(function (value) {
      //console.log(value["metadata"].time);
      //console.log(dateMes2);
      console.log(value["payload_fields"]);
    let nivTab = nivOzone;
      if (value["metadata"].time.substring(0, 10) == dateMes2) {
        console.log(value["metadata"]["time"]);
        //niveaux de concentration d'ozone
        if(polluant=="co"){
          nivTab = nivCO;
        }else if(polluant == "pm10"){
          nivTab = nivPm10;
        }else if(polluant == "pm2_5"){
          nivTab = nivPm25;
        }else if(polluant == "nh3"){
          nivTab = nivNH3;
        }else if(polluant == "no2"){
          nivTab = nivNO2;
        };

        if(value["payload_fields"] != null){
        let val = parseInt(value["payload_fields"][polluant]);
        console.log(polluant+" value is "+val);
          if(val > nivTab[0]){icon="icon4"}else if(val > nivTab[1]){icon="icon3"}else if(val > nivTab[2]){icon="icon2"}else{icon="icon1"};
          //tableau contenant des infos pour chaque capteur [nom_capteur,coordonnéesX,coordonéesY, nom station] pour un polluant donné
          let dataSensor = [["arduino","43.57","1.47","INSA Toulouse"],["lopy1","43.57","1.47","INSA Toulouse"],["lopy3","43.57","1.47","INSA Toulouse"],["lopy4n2","43.57","1.47","INSA Toulouse"]];
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
        }else{
          console.log("No Payload Fields");
        }
      };
    })

    //CLICK SUR UN MARQUEUR
  //affichage des details lors du clique sur un marqueur (code Javascript)
  function details(e){
    //affichage du tableau des données pour un capteur précis
    var el = document.getElementById("tableau");
    var el2 = document.getElementById("nomStation");
    el.innerHTML="";
    //el.DataTable();
    var dps = [];
    var dpsPm10 = [];
    var dpsCO = [];
    var dpsPM25 = [];
    var dpsNH3 = [];
    var dpsNO2 = [];
    var dpsTemp = [];
    var dpsHum = [];

    el2.innerHTML=e.sourceTarget.options.title;
    var table="<table class=\"table-reponsive-md\"><tr><th>CO</th><th>Humidité</th><th>NH3</th><th>NO2</th><th>PPM 2.5</th><th>PPM 10</th><th>Pression</th><th>Température</th><th>date</th><th>time</th></tr>";
        for(var i=0;i<tab.length;i++)
    {
      if(tab[i]["dev_id"]==e.sourceTarget.options.title){
        if(tab[i]["payload_fields"] != null){
          console.log(tab[i]);
          console.log(tab[i]["payload_fields"]);
      table+="<tr><td>"+tab[i]["payload_fields"]["co"]+"</td><td>"+tab[i]["payload_fields"]["humidity"]+"</td><td>"+tab[i]["payload_fields"]["nh3"]+"</td><td>"+tab[i]["payload_fields"]["no2"]+"</td><td>"+tab[i]["payload_fields"]["ppm2_5"]+"</td><td>"+tab[i]["payload_fields"]["ppm10"]+"</td><td>"+tab[i]["payload_fields"]["pressure"]+"</td><td>"+tab[i]["payload_fields"]["temperature"]+"</td><td>"+tab[i]["metadata"]["time"].substring(0, 10)+"</td><td>"+tab[i]["metadata"]["time"].substring(11, 16)+"</td><td>"+"</td></tr></table>";
   //tableau de données pour PM10
      dpsPm10.push({
        x: Date.parse(tab[i]["metadata"]["time"]),
        y: parseFloat(tab[i]["payload_fields"]["ppm10"])
      })
    //tableau de données pour CO
    dpsCO.push({
      x: Date.parse(tab[i]["metadata"]["time"]),
      y: parseFloat(tab[i]["payload_fields"]["co"])
    })
    //tableau de données pour PM25
    dpsPM25.push({
      x: Date.parse(tab[i]["metadata"]["time"]),
      y: parseFloat(tab[i]["payload_fields"]["ppm2_5"])
    })
    //tableau de données pour NH3
    dpsNH3.push({
      x: Date.parse(tab[i]["metadata"]["time"]),
      y: parseFloat(tab[i]["payload_fields"]["nh3"])
    })
    //tableau de données pour NO2
    dpsNO2.push({
      x: Date.parse(tab[i]["metadata"]["time"]),
      y: parseFloat(tab[i]["payload_fields"]["no2"])
    })
    //tableau de données pour température
    let valT = parseFloat(tab[i]["payload_fields"]["temperature"]);
    if(valT==0){valT=null};
    dpsTemp.push({
      x: Date.parse(tab[i]["metadata"]["time"]),
      y: valT
    })
    //tableau de données pour humidité
    let valH = parseFloat(tab[i]["payload_fields"]["humidity"]);
    if(valH==0){valH=null};
    dpsHum.push({
      x: Date.parse(tab[i]["metadata"]["time"]),
      y: valH
    })
    }else{
      console.log("no payload fields")
    }
  }
    }
    el.innerHTML+=table+"</table>";

    function compareDataPointX(dataPoint1, dataPoint2) {
      return dataPoint1.x - dataPoint2.x;
    }

    //GRAPHIQUES DE DONNEES
    //génération d'un graphique de données
    let chart = new CanvasJS.Chart("chartContainer", {
      animationEnabled: true,
      title: {
        text: "Concentration en PPM10"
      },
      theme: "light1",
      axisX: {
        title: "Time"
      },
      axisY: {
        title: "Taux",
        suffix: "µg/m-3"
      },
      data: [
      {
        type: "line",
       // color: "red",
        name: "Concentration en PM10",
        connectNullData: true,
        xValueType: "dateTime",
        xValueFormatString: "DD MMM hh:mm TT",
        yValueFormatString: "#,##0.##\"ug.m-3\"",
        dataPoints: dpsPm10
      }
    ]
    });
    chart.options.data[0].dataPoints.sort(compareDataPointX);//order by asc date
    chart.render();

    //Graphique Monoxyde Carbone
    let chartCO = new CanvasJS.Chart("chartContainerCO", {
      animationEnabled: true,
      title: {
        text: "Concentration en Monoxyde de Carbone"
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
        name: "Concentration en CO",
        connectNullData: true,
        //nullDataLineDashType: "solid",
        xValueType: "dateTime",
        xValueFormatString: "DD MMM hh:mm TT",
        yValueFormatString: "#,##0.##\"ug.m-3\"",
        dataPoints: dpsCO
      }]
    });
    chartCO.options.data[0].dataPoints.sort(compareDataPointX);//order by asc date
    chartCO.render();

    //Graphique NH3
    let chartNH3 = new CanvasJS.Chart("chartContainerNH3", {
      animationEnabled: true,
      title: {
        text: "Concentration en Ammoniac"
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
        name: "Concentration en NH3",
        connectNullData: true,
        //nullDataLineDashType: "solid",
        xValueType: "dateTime",
        xValueFormatString: "DD MMM hh:mm TT",
        yValueFormatString: "#,##0.##\"ug.m-3\"",
        dataPoints: dpsNH3
      }]
    });
    chartNH3.options.data[0].dataPoints.sort(compareDataPointX);//order by asc date
    chartNH3.render();

    //Graphique NO2
    let chartNO2 = new CanvasJS.Chart("chartContainerNO2", {
      animationEnabled: true,
      title: {
        text: "Concentration en Dioxyde d'Azote"
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
        name: "Concentration en NO2",
        connectNullData: true,
        //nullDataLineDashType: "solid",
        xValueType: "dateTime",
        xValueFormatString: "DD MMM hh:mm TT",
        yValueFormatString: "#,##0.##\"ug.m-3\"",
        dataPoints: dpsNO2
      }]
    });
    chartNO2.options.data[0].dataPoints.sort(compareDataPointX);//order by asc date
    chartNO2.render();

    //Graphique PPM25
    let chartPM25 = new CanvasJS.Chart("chartContainerPM25", {
      animationEnabled: true,
      title: {
        text: "Concentration en Particules fines (PPM 2.5)"
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
        name: "Concentration en PM25",
        connectNullData: true,
        //nullDataLineDashType: "solid",
        xValueType: "dateTime",
        xValueFormatString: "DD MMM hh:mm TT",
        yValueFormatString: "#,##0.##\"ug.m-3\"",
        dataPoints: dpsPM25
      }]
    });
    chartPM25.options.data[0].dataPoints.sort(compareDataPointX);//order by asc date
    chartPM25.render();

    //Graphique température & humidité
    let chartTH = new CanvasJS.Chart("chartContainerTH", {
      animationEnabled: true,
      title: {
        text: "Température et Humidité"
      },
      theme: "light1",
      axisX: {
        title: "Time"
      },
      axisY: {
      },
      data: [
      {
        type: "line",
       // color: "red",
        name: "Température",
        connectNullData: true,
        xValueType: "dateTime",
        xValueFormatString: "DD MMM hh:mm TT",
        yValueFormatString: "#,##0.##\"° C\"",
        dataPoints: dpsTemp
      },
      {
        type: "line",
        color: "red",
        name: "Humidité",
        connectNullData: true,
        xValueType: "dateTime",
        xValueFormatString: "DD MMM hh:mm TT",
        yValueFormatString: "#,##0.##\"%\"",
        dataPoints: dpsHum
      }
    ]
    });
    chartTH.options.data[0].dataPoints.sort(compareDataPointX);//order by asc date
    chartTH.options.data[1].dataPoints.sort(compareDataPointX);//order by asc date
    chartTH.render();
  }
  }

  //Mise a jour de la date par rapport a la selection
  onDateChanged(): void {
    this.dateMes = this.datePipe.transform(this.dateMesB, 'yyyy-MM-dd');
    this.afficherCarte();
  }

  //Mise a jour du polluant par rapport a la selection
  //Ai fait 2 fonctions pour les phases de test mais peut (doit?) etre reduit
  pm10(){
    this.polluant="ppm10";
    this.afficherCarte();
  }  

  pm25(){
    this.polluant="ppm2_5";
    this.afficherCarte();
  }

  nh3(){
    this.polluant="nh3";
    this.afficherCarte();
  }

  co(){
    this.polluant="co";
    this.afficherCarte();
  }

  no2(){
    this.polluant="no2";
    this.afficherCarte();
  }

  onMapClick(){
    this.clicked=false;
  }
  
}
