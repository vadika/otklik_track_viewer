class GpxWorks{
    constructor(data){
        if(data instanceof XMLDocument) {
            this.track = this.getTracks(data);
        }
        else
            console.error("Полученные данные не являются документом XML.");
    }

    getTracks(xmlDoc){
        if(xmlDoc) {
            var res = [];
            var trks = xmlDoc.documentElement.getElementsByTagName("trk");            
            for(const trk of trks) {
                var track = this.getTrack(trk);
                if(track)
                    res.push(track);
            }
            return res;
        }
        else
            return null;
    }

    getTrack(trkElement){
        if(trkElement) {
            var res = { 
                name: (trkElement.getElementsByTagName("name")[0] || 0).textContent || null, 
                seg: [] 
            };
            var trkSegs = trkElement.getElementsByTagName("trkseg");  
            var dst = 0;          
            for(const seg of trkSegs) {
                var sego = this.getTrackSegment(seg);
                if(sego) {
                    if(sego.startTime && !res.startTime)
                        res.startTime = sego.startTime;
                    if(sego.endTime)
                        res.endTime = sego.endTime;
                    res.seg.push(sego);
                    dst+=sego.dist;
                }
            }
            res.dist = dst;
            return res;
        }
        else
            return null;
    }

    getTrackSegment(segElement){
        if(segElement) {
            var res = { point: [] };
            var trkPts = segElement.getElementsByTagName("trkpt");
            var ptp = null;
            var dst = 0;
            for(const pt of trkPts) {
                var time = (pt.getElementsByTagName("time")[0] || 0).textContent;
                var pto = { 
                    lat: parseFloat(pt.getAttribute("lat")), 
                    lng: parseFloat(pt.getAttribute("lon")),
                    time: time? new Date(time) : null
                };
                if(pto.time) {
                    if(!res.startTime) res.startTime = pto.time;
                    res.endTime = pto.time;
                }                    
                if(ptp) {
                    dst+=CoordConverter.distance(ptp, pto);
                }
                ptp = pto;
                res.point.push(pto);
            }
            res.dist = dst;
            return res;
        }
        else
            return null;
    }
}

