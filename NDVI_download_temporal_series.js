var s2 = ee.ImageCollection('COPERNICUS/S2_SR');    //Collection
var aoi =  ee.FeatureCollection("projects/ee-jlcaclosada/assets/zona_demeter");     //Our Area of interest (upload shapefile)
var epsg = 25830



//Visualization variable
var ndvi_vis = {bands: 'NDVI', min: -0.2, max: 1, palette:['blue', 'lightgreen', 'lightyellow','orange','red']};



//Cloudmask
function maskSCL_P(image) {
  var probab = image.select('MSK_CLDPRB');
  var scl = image.select('SCL');

  var mask = scl.eq(0).or(scl.eq(1)).or(scl.eq(2)).or(scl.eq(3).focalMax(5)).or(scl.eq(11));
  mask = mask.or(probab.gt(65));

  return image.updateMask(mask.not()).select("B.*").copyProperties(image);
}



//NDVI proccess

var addNDVI = function(image) {
  return image.addBands(image.normalizedDifference(['B8', 'B4']).rename('NDVI'));
};


//NDVI ENMASCARADO


var fi = ee.Date.fromYMD(2020,3,1);     //Define de start date

for (var i = 0; i < 245; i++) {     //+245 days from the start date
  var ff = fi.advance(1, 'Day');
  var ndvi_s2 = s2.filterBounds(aoi).filterDate(fi, ff).map(maskSCL_P).map(addNDVI);
  
  if (ndvi_s2.size().getInfo() > 0) {
    var ndvi_mosaic = ndvi_s2.mosaic()
    var name = 'NDVI_BOA_S2A_' + fi.format('YYYYMMdd').getInfo();
    print(fi);
    
    Export.image.toDrive( {         //Export to Google Drive
      image: ndvi_mosaic.select('NDVI'),
      description: name,
      fileNamePrefix: name,
      scale: 10,
      region: aoi,
      maxPixels: 1e13,
      crs: 'EPSG:' + epsg
    });
  }
  fi = ff
}
 