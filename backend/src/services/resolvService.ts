import { Riga } from "../interfaces/interfaces";
import { Utilities } from '../shared/utilities';
const fs = require('fs');
const path = require('path');
const cfg = require('config');
//var resolvmon = require('resolvmon');
const lineReader = require('line-reader');
const PromiseBB = require('bluebird');
const os = require('os');
const util = require('util');
const exec = util.promisify(require('child_process').exec);


export default class ResolvService {

    async execute(file: string) {
      
        const data_f = await this.ReadFileResolv(file);
            //console.log("--> ", data_f);
        return data_f;
    }

    async ReadFileResolv (file: string) {

        try {

        //const promise = new Promise(async(resolve, reject) => {

            let data_file: Riga[] = new Array();
            let temp: Riga;
            //resolvmon.start();
            //console.log("RESOLV: News Changes");

            const eachLine = PromiseBB.promisify(lineReader.eachLine);
            await eachLine(file, function (line: string) {
            //await lineReader.eachLine(path.join(__dirname, '../../src/test.txt'), function (line: string) {
                //console.log(line);
                let splitted = line.split(" ");
                // console.log("--> ", splitted.length);
                // console.log(splitted);

                if (splitted.length === 2) {
                    for (let i in splitted) {
                        //console.log(splitted)
                        //console.log("--> [",i,"] ",splitted[i]);
                        if (i === '1') {
                            let splitted_ip = splitted[1].split(".");
                            if (splitted_ip.length === 4) {
                                //console.log ( splitted[1] )
                                temp = { type: 1, text: splitted[0], ip: splitted[1] };
                                data_file.push(temp);
                            }
                            else {
                                temp = { type: 0, text: line, ip: "0" };
                                data_file.push(temp);
                            }
                        }
                        

                    }
                }
                else {
                    temp = { type: 0, text: line, ip: "0" };
                    //console.log("TEMP: ",temp);
                    data_file.push(temp);
                }

                //console.log("-----------------");

                //splitted.lenght();
                //console.log(data_file);
                //resolve(data_file);

            });
            return data_file;
        //});
        //return promise;
    } catch (error) {
        console.log("ERRR", error);
    }

    
    }

    async getmyip(){

        const data_ip = await this.generatemyip();
            //console.log("--> ", data_ip);
            return data_ip;

    }

    async generatemyip(){

        let ip_list: [string,string][] = new Array();
        let ip_list_1: any = {};
        let ifaces = os.networkInterfaces();

        Object.keys(ifaces).forEach(function (ifname) {
            var alias = 0;
          
            ifaces[ifname].forEach(function (iface: any) {
              if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
              }
          
              if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
                //ip_list.push(ifname + ':' + alias, iface.address);
                //console.log(ifname + ':' + alias, iface.address);
              } else {
                // this interface has only one ipv4 adress
                ip_list.push([ifname, iface.address]);
                ip_list_1[ifname] = iface.address;
                //console.log(ifname, iface.address);
              }
              ++alias;
            });
          });
          return ip_list_1;
    }

    async changefile(list_ip: any, data_file: any){
        
        try {

        let new_1rf_dns: string;
        let new_resolv: string;

        //console.log(list_ip[cfg.gateway.interface_for_resolv]);
        if(list_ip[cfg.gateway.interface_for_resolv]){

            let splitted_ip_dns = list_ip[cfg.gateway.interface_for_resolv].split(".");

            for ( let i in data_file){

                if ( data_file[i].type === 1){
                    let splitted_ip_file = data_file[i].ip.split(".")

                    if ( splitted_ip_file[0] === splitted_ip_dns[0] &&  splitted_ip_file[1] === splitted_ip_dns[1] && splitted_ip_file[2] === splitted_ip_dns[2]) {

                        new_1rf_dns = (data_file[i].text + " " + data_file[i].ip);
                        //console.log("eccolo --> ",data_file[i].text, " ", data_file[i].ip);
                        //console.log(new_1rf_dns);
                    }
                }

            }

            new_resolv = new_1rf_dns;

            for ( let i in data_file){
                
                if (! ( data_file[i].text === new_1rf_dns.split(" ")[0] && data_file[i].ip === new_1rf_dns.split(" ")[1] ) ){

                    if ( data_file[i].type === 1 ){
                        new_resolv = new_resolv +"\n"+data_file[i].text+" "+data_file[i].ip;
                        //console.log(data_file[i].text+" "+data_file[i].ip)
                    }
                    if ( data_file[i].type === 0 ){
                        new_resolv = new_resolv +"\n"+data_file[i].text;
                    }
    
                }
            
            }

            //await this.WriteFileF(cfg.gateway.path_resolv,new_resolv);
            await this.WriteFileF(cfg.gateway.path_temp_out,new_resolv);

        }
        
    } catch (error) {
        console.log("ERRR_GATEWAY_INTERFACE", error);
    }
    
    }

     WriteFileF(path: string,content: string){

        const promise = new Promise(async(resolve, reject) => {

        //Utilities.writeFile(path,content);
        await fs.writeFile(path, content, function (err: any) {
            if (err) console.log(err);
            else console.log("file saved");
        });

        resolve("ok");
        });
        return promise;
    }


    async replace_file(){

        try {
            const { stdout, stderr } = await exec(` sudo /bin/sh -c 'sudo cat ${cfg.gateway.path_temp_out} > ${cfg.gateway.path_resolv}'`);
            console.log('RESOLV: stdout:', stdout);
            console.log('RESOLV: stderr:', stderr);
        } catch (error) {
            console.log('RESOLV: error replace file:', error);
        }


    }

}

