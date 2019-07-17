class SarMapManager {
    constructor(sarMapDivId, trackDetailsId, getMapCenterStr, setMapCenterStr) {
        this.sarMapDivId = sarMapDivId;
        this.trackDetailsId = trackDetailsId;
        this.getMapCenterStr = getMapCenterStr;
        this.setMapCenterStr = setMapCenterStr;
        this.gpxFile = [];
        this.defTrackOpt = {
            width: 2,
            color: "#fff",
            opacity: 1
        };
    }

    getCoordSarCenter() { 
        if(this.getMapCenterStr && this.getMapCenterStr instanceof Function)
            return CoordConverter.parseDegMin(this.getMapCenterStr()); 
        else
            return null;
    }

    setCoordSarCenter(latLng) { 
        if(this.setMapCenterStr && this.setMapCenterStr instanceof Function)
            this.setMapCenterStr(CoordConverter.formatLatLngDegMin(latLng));
    }

    getMapDiv() {
        return document.getElementById(this.sarMapDivId);
    }

    getDetailsDiv() {
        return document.getElementById(this.trackDetailsId);
    }

    initMap() {
        var sarCenter = this.getCoordSarCenter();
        var mapOptions = {
            backgroundColor: null,
            center: { lat: 60, lng: 30 },
            clickableIcons: true,
            controlSize: 32,
            disableDefaultUI: false,
            disableDoubleClickZoom: true,
            draggable: true,
            draggableCursor: "pointer",
            draggingCursor: "grabbing",
            fullscreenControl: true,
            fullscreenControlOptions: { 
                position: google.maps.ControlPosition.RIGHT_TOP 
            },
            gestureHandling: "cooperative",
            heading: 0,
            keyboardShortcuts: false,
            mapTypeControl: true,
            mapTypeControlOptions: { 
                mapTypeIds: ["ROADMAP", "SATELLITE", "HYBRID"], 
                position: google.maps.ControlPosition.LEFT_TOP, 
                style: google.maps.MapTypeControlStyle.DEFAULT },
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            maxZoom: 20,
            minZoom: 3,
            noClear: false,
            restriction: null,
            rotateControl: true,
            rotateControlOptions: { 
                position: google.maps.ControlPosition.LEFT_BOTTOM 
            },
            scaleControl: true,
            scaleControlOptions: {},
            styles: [],
            tilt: 0,            
            zoom: 10,
            zoomControl: true,
            zoomControlOptions: { 
                position: google.maps.ControlPosition.RIGHT 
            }
        };
        if (sarCenter) {
            mapOptions.center = sarCenter,
            mapOptions.zoom = 14,
            mapOptions.mapTypeId = google.maps.MapTypeId.SATELLITE
            };
        var container = this.getMapDiv();
        if (container) {
            this.map = new google.maps.Map(container, mapOptions);
            var details = $(this.getDetailsDiv());       
            this.map.addListener("click", function(e) {
                details.empty().append($("<div>").text("Точка "+CoordConverter.formatLatLngDegMin(e.latLng)));
            });
        }
        else
            console.error("Не найден контейнер карты ПСР.");
        return this;
    }

    initCenterMarker() {
        if (this.map) {
            var marker = new google.maps.Marker({
                position: this.map.center,
                label: "CP",
                title: "Центр района",
                draggable: true,
                map: this.map
            });
            var _this = this;
            marker.addListener('drag', function(pos) { _this.setCoordSarCenter(pos.latLng); });
            this.centerMarker = marker;
        }
        else
            console.error("Карта ПСР не инициализирована.");
        return this;
    }

    static parseOptions(s) {
        var res = {};
        var m = s.match(/\(no\)/i);
        if(m) {
            res.no = true;
            return res;
        }
        var m = s.match(/\(c:(#[0-9a-f]{3,6})\)/i);
        if(m) 
            res.color=m[1];
        else {
            var m = s.match(/\(c:([0-9]+)\)/i);
            if(m) 
                res.color=SarMapManager.getColor(parseInt(m[1]));
        }
        var m = s.match(/\(o:([0-9])\)/i);
        if(m) 
            res.opacity=0.1*parseInt(m[1]);
        var m = s.match(/\(w:([0-9]\.?[0-9]?)\)/i);
        if(m) 
            res.width=parseFloat(m[1]);
        var m = s.match(/\(t\<(.+?)\)/i);
        if(m)
            res.toTime = new Date(m[1]);
        var m = s.match(/\(t\>(.+?)\)/i);
        if(m)
            res.fromTime = new Date(m[1]);
        return res;
    }

    loadGPXAttach(url, fileName, fileDesc) {
        var options = SarMapManager.parseOptions(fileDesc);
        options.index = this.gpxFile.push({})-1;
        if(options.no)
            return;
        if(!options.color)
            options.color = SarMapManager.getColor(options.index);
        var _this = this;
        $.ajax({
            url: url,
            dataType: "xml",
            success: function(data) {
                var gpxFile = new GpxWorks(data);
                gpxFile.fileName = fileName;
                gpxFile.description = fileDesc;
                gpxFile.options = options;
                _this.gpxFile[options.index] = gpxFile; 
                _this.renderGPXAttach(gpxFile);
            }
        });
        return this;
    }

    static getAttachElement(fileName) {
        return $(".attachments a.icon-attachment:contains('"+fileName+"')");
    }

    static getTimeIntervalStr(d1, d2)
    {
        var res = [];
        if((d1 instanceof Date) && (d2 instanceof Date)) {
            if(d2<d1)
                [d1, d2] = [d2, d1];
            var dif = (d2-d1)/1000;
            res.push(dif<3600? `(${(dif/60).toFixed(1)} мин)` : `(${(dif/3600).toFixed(1)} ч)`);
        }
        if(d2 instanceof Date) res.unshift(`до ${d2.toLocaleString("ru-ru")}`);
        if(d1 instanceof Date) res.unshift(`от ${d1.toLocaleString("ru-ru")}`);
        return res? res.join(" ") : null;
    }

    renderGPXAttach(gpxFile, options) {
        if (!this.map) {
            console.error("Карта ПСР не инициализирована.");
            return;
        }
        options = options || {};
        if(gpxFile.options) {
            for(const opt in gpxFile.options) {
                if(!(opt in options))
                    options[opt] = gpxFile.options[opt];
            }
        }
        for(const opt in this.defTrackOpt) {
            if(!(opt in options))
                options[opt] = this.defTrackOpt[opt];
        }
        if(options.no) return;
        var details = $(this.getDetailsDiv());                
        var attachContainer = SarMapManager.getAttachElement(gpxFile.fileName);

        for(var ti = 0; ti < (gpxFile.track || []).length || 0; ti++) {
            let track = gpxFile.track[ti];
            if(track.endTime < options.fromTime)
                continue;
            if(track.startTime > options.toTime)
                continue;
            for(var si = 0; si < (track.seg || []).length || 0; si++) {
                let seg = track.seg[si];
                if(seg.endTime < options.fromTime)
                    continue;
                if(seg.startTime > options.toTime)
                    continue;
                let pp = seg.point;
                if(seg.startTime<options.fromTime)
                {
                    let ppi = pp.findIndex((el, i) => el.time>options.fromTime);
                    pp = pp.slice(ppi);
                }
                if(seg.endTime>options.toTime)
                {
                    let ppi = pp.findIndex((el, i) => el.time>options.toTime);
                    if(ppi>0)
                        pp = pp.slice(0, ppi-1);
                }

                let polyline = new google.maps.Polyline({                        
                    path: pp,
                    strokeColor: options.color,
                    strokeWeight: options.width,
                    strokeOpacity: options.opacity,
                    clickable: true,
                    draggable: false,
                    editable: false,
                    icons: null,
                    visible: true,
                    map: this.map
                });

                polyline.addListener("mouseover", function(e) {
                    attachContainer.css({'background-color': '#55ff55'});
                });
                polyline.addListener("mouseout", function(e) {
                    attachContainer.css({'background-color': ''});
                });
                let segN = si;
                polyline.addListener("click", function(e) {
                    //console.log(gpxFile, track, seg);
                    details.empty();
                    details.append($("<div>").text("Файл: \""+gpxFile.fileName+"\""+(gpxFile.description? " ("+gpxFile.description+")" : "")));
                    details.append($("<div>").text(`Трек: \"${track.name}\" ${track.dist? "("+(track.dist/1000).toFixed(1)+" км)" : ""} ${SarMapManager.getTimeIntervalStr(track.startTime, track.endTime)}`));
                    if(track.seg.length>1) {
                        for(let i=0; i<track.seg.length; i++) {
                            let segc = track.seg[i];
                            details.append($("<div style='color:"+(i==segN? "red": "gray")+";'>").text(`Сегмент №${i+1} ${segc.dist? "("+(segc.dist/1000).toFixed(1)+" км)" : ""} ${SarMapManager.getTimeIntervalStr(segc.startTime, segc.endTime)}`));
                        }
                    }
                });
            }
        }
    }

    loadPointsFromHistory() {
        if (this.map) {
            var pts = CoordConverter.parsePointAll($("#history").text());
            var map = this.map;
            pts.forEach(function (p) {
                p.map = map;
                new google.maps.Marker(p);
            });
        }
        else
            console.error("Карта ПСР не инициализирована.");
        return this;
    }

    static getColor(i) {
        var a = [
        "#FFFF00", "#1CE6FF", "#FF34FF", "#FF4A46", "#006FA6", "#A30059",
        "#FFDBE5", "#63FFAC", "#B79762", "#8FB0FF", "#997D87",
        "#809693", "#FEFFE6", "#4FC601", "#3B5DFF", "#FF2F80",
        "#BA0900", "#6B7900", "#00C2A0", "#FFAA92", "#FF90C9", "#B903AA", "#D16100",
        "#DDEFFF", "#A1C299", "#0AA6D8", "#00846F",
        "#FFB500", "#C2FFED", "#A079BF", "#CC0744", "#C0B9B2", "#C2FF99", 
        "#00489C", "#6F0062", "#0CBD66", "#EEC3FF", "#B77B68", "#7A87A1", "#788D66",
        "#885578", "#FAD09F", "#FF8A9A", "#D157A0", "#BEC459", "#456648", "#0086ED", "#886F4C",
        "#B4A8BD", "#00A6AA", "#A3C8C9", "#FF913F", 
        "#00FECF", "#B05B6F", "#8CD0FF", "#3B9700", "#04F757", "#C8A1A1", 
        "#7900D7", "#A77500", "#6367A9", "#A05837", "#6B002C", "#D790FF", "#9B9700",
        "#549E79", "#FFF69F", "#72418F", "#BC23FF", "#99ADC0", "#922329",
        "#FDE8DC", "#0089A3", "#CB7E98", "#A4E804", "#324E72", "#6A3A4C",
        "#83AB58", "#D1F7CE", "#C8D0F6", "#A3A489", "#806C66", 
        "#BF5650", "#E83000", "#66796D", "#DA007C", "#FF1A59", "#8ADBB4", "#5B4E51",
        "#C895C5", "#320033", "#FF6832", "#66E1D3", "#CFCDAC", "#D0AC94", "#7ED379", "#012C58",
        "#7A7BFF", "#D68E01", "#353339", "#78AFA1", "#FEB2C6", "#75797C", "#837393", "#943A4D",
        "#B5F4FF", "#D2DCD5", "#9556BD", "#6A714A", "#001325", "#02525F", "#0AA3F7", "#E98176",
        "#DBD5DD", "#5EBCD1", "#3D4F44", "#7E6405", "#02684E", "#962B75", "#8D8546", "#9695C5",
        "#E773CE", "#D86A78", "#3E89BE", "#CA834E", "#518A87", "#5B113C", "#55813B", "#E704C4",
        "#00005F", "#A97399", "#4B8160", "#59738A", "#FF5DA7", "#F7C9BF", "#643127", "#513A01",
        "#6B94AA", "#51A058", "#A45B02", "#1D1702", "#E20027", "#E7AB63", "#4C6001", "#9C6966",
        "#64547B", "#97979E", "#006A66", "#391406", "#F4D749", "#0045D2", "#006C31", "#DDB6D0",
        "#7C6571", "#9FB2A4", "#00D891", "#15A08A", "#BC65E9", "#FFFFFE", "#C6DC99", "#203B3C",
        "#671190", "#6B3A64", "#F5E1FF", "#FFA0F2", "#CCAA35", "#374527", "#8BB400", "#797868",
        "#C6005A", "#3B000A", "#C86240", "#29607C", "#402334", "#7D5A44", "#CCB87C", "#B88183",
        "#AA5199", "#B5D6C3", "#A38469", "#9F94F0", "#A74571", "#B894A6", "#71BB8C", "#00B433",
        "#789EC9", "#6D80BA", "#953F00", "#5EFF03", "#E4FFFC", "#1BE177", "#BCB1E5", "#76912F",
        "#003109", "#0060CD", "#D20096", "#895563", "#29201D", "#5B3213", "#A76F42", "#89412E",
        "#1A3A2A", "#494B5A", "#A88C85", "#F4ABAA", "#A3F3AB", "#00C6C8", "#EA8B66", "#958A9F",
        "#BDC9D2", "#9FA064", "#BE4700", "#658188", "#83A485", "#453C23", "#47675D", "#3A3F00",
        "#061203", "#DFFB71", "#868E7E", "#98D058", "#6C8F7D", "#D7BFC2", "#3C3E6E", "#D83D66",
        "#2F5D9B", "#6C5E46", "#D25B88", "#5B656C", "#00B57F", "#866097", "#365D25",
        "#252F99", "#00CCFF", "#674E60", "#FC009C", "#92896B" ];
        return a[i%a.length];
    }
}









