class CoordConverter {  
    static getPoint(ll) {
      if(ll && ll.lat && ll.lng) {
        var p = { lat: parseFloat(ll.lat instanceof Function? ll.lat() : ll.lat), lng: parseFloat(ll.lng instanceof Function? ll.lng() : ll.lng) }
        if(!p.lat && p.lat!==0 || !p.lng && p.lng!==0 || p.lat<-90 || p.lat>90 || p.lng<-180 || p.lng>180)
          return null;
        else
          return p;
      }
      else return null;
    }

    static formatDegMin(val, ltrPlus, ltrMinus)
    {
      val = parseFloat(val);
      if(val!==0 && !val)
        return null;
      var ltr = val>=0? ltrPlus: ltrMinus;
      val = Math.abs(val);
      var min = (val-Math.trunc(val))*60;
      return ltr+(val<10? "0": "")+Math.trunc(val)+"°"+(min<10?"0":"")+min.toFixed(5).replace(".",",")+"'";
    }

    static formatLatLngDegMin(ll) {
      var p = this.getPoint(ll);
      if(p)
        return this.formatDegMin(p.lat, "N", "S")+" "+this.formatDegMin(p.lng, "E", "W")
      else
        return null;
    }
  
    static fromMatch(m)
    {
      if(m && m.length>=7)
        return this.getPoint({ 
          lat: parseInt(m[1])+parseFloat(m[2]+m[3].replace(",", "."))/60, 
          lng: parseInt(m[4])+parseFloat(m[5]+m[6].replace(",", "."))/60 
        });
      else
        return null;
    }

    static parseAllDegMin(str)
    {
      var res = [];
      if(str) {
        var matches = str.matchAll(/N(0?[0-8][0-9])°\s*([0-5][0-9])([\,\.][0-9]+)?'\s*E((?:0?[0-9][0-9])|(?:1[0-7][0-9]))°\s*([0-5][0-9])([\,\.][0-9]+)?'/ig);
        for(const m of matches) {
          var ll = this.fromMatch(m);
          if(ll) res.push(ll);
        }
      }
      return res;
    }
  
    static parseDegMin(str)
    {
      if(str) {
        var m = str.match(/N(0?[0-8][0-9])°\s*([0-5][0-9])([\,\.][0-9]+)?'\s*E((?:0?[0-9][0-9])|(?:1[0-7][0-9]))°\s*([0-5][0-9])([\,\.][0-9]+)?'/i);
        return this.fromMatch(m);
      }
      else
        return null;
    }
  
    static parsePointAll(str) {
      var res = [];
      if(str) {
        var matches = str.matchAll(/\(\s*N(0?[0-8][0-9])°\s*([0-5][0-9])([\,\.][0-9]+)?'\s*E((?:0?[0-9][0-9])|(?:1[0-7][0-9]))°\s*([0-5][0-9])([\,\.][0-9]+)?'\s*(\w{1,3})?\s*(.*?)?\s*\)/ig);
        for(const m of matches) {
          res.push({ 
            position: this.fromMatch(m),
            label: m[7], 
            title: m[8], 
          });
        }
      }
      return res;
    }

    static distance(ll1, ll2)
    {
      var p1 = this.getPoint(ll1);
      var p2 = this.getPoint(ll2);
      if(!p1 || !p2) return null;
      var deltaA = Math.sqrt(Math.pow(p1.lat-p2.lat, 2)+Math.pow((p1.lng-p2.lng)*Math.cos((p1.lat+p2.lat)/2*Math.PI/180), 2));
      return this.RE * Math.PI / 180 * deltaA;
    }

    static get RE() { return 6371008.8 };
  }