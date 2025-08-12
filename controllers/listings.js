const Listing = require("../models/listing");
const geocoder = require("../utils/geocoder");



module.exports.index = async(req,res)=>{

  const allListings=await Listing.find({});
  res.render("listings/index.ejs",{allListings});
  };

 module.exports.renderNewForm= (req,res)=>{
  res.render("listings/new.ejs");
  };


module.exports.showListing = async(req,res)=>{
      let {id}=req.params;
      const listing = await Listing.findById(id)
      .populate({
        path:"reviews",
      populate:{
        path:"author",
    },
  })
      .populate("owner");
      if(!listing){
        req.flash("error","Listing you requested for does not exist!"); 
        return res.redirect("/listings");
      }
      console.log(listing);
      res.render("listings/show.ejs", { listing});
    };
    
module.exports.createListing = async function(req, res, next) {
    try {
        let url = req.file.path;
        let filename = req.file.filename;
        
        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;
        newListing.image = {url, filename};

        // Geocode the address
        const location = `${req.body.listing.location}, ${req.body.listing.country}`;
        console.log("Geocoding location:", location);
        
        let geoData;
        try {
            geoData = await geocoder.geocode(location);
            console.log("Initial geocoding response:", geoData);
            
            // If no results, try with just the location name
            if (!geoData || geoData.length === 0) {
                console.log("Retrying with just location name:", req.body.listing.location);
                geoData = await geocoder.geocode(req.body.listing.location);
                console.log("Second attempt geocoding response:", geoData);
            }
        } catch (geocodeError) {
            console.error("Geocoding error:", geocodeError);
            geoData = null;
        }

        // Set coordinates either from geocoding or fallback
        if (geoData && geoData[0]) {
            newListing.geometry = {
                type: 'Point',
                coordinates: [geoData[0].longitude, geoData[0].latitude]
            };
            console.log("Saved geometry from geocoding:", newListing.geometry);
        } else if (location.toLowerCase().includes('andaman')) {
            newListing.geometry = {
                type: 'Point',
                coordinates: [92.8797, 11.7401] // Coordinates for Andaman Islands
            };
            console.log("Using fallback coordinates for Andaman");
        } else {
            console.log("No coordinates set for location:", location);
        }

        await newListing.save();
        req.flash("success", "New Listing Created!");      
        res.redirect("/listings");
    } catch (err) {
        console.error("Error creating listing:", err);
        next(err);
    }
};
              

          

module.exports.renderEditForm = async(req,res)=>{
      let {id}= req.params;
      const listing = await Listing.findById(id);
       if(!listing){
      req.flash("error","Listing you requested for does not exist!"); 
      return res.redirect("/listings");
    }
      let originalImageUrl=listing.image.url;
      originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_200");
      res.render("listings/edit.ejs", { listing, originalImageUrl});
    };
module.exports.updateListing = async function(req, res, next) {
    try {
        let {id} = req.params;
        let listing = await Listing.findById(id);

        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/listings");
        }

        // Update basic info
        Object.assign(listing, req.body.listing);

        // Update image if new one is uploaded
        if(typeof req.file !== "undefined"){
            let url = req.file.path;
            let filename = req.file.filename;
            listing.image = {url,filename};
        }

        // Update coordinates
        const location = `${req.body.listing.location}, ${req.body.listing.country}`;
        console.log("Geocoding location for update:", location);
        
        let geoData;
        try {
            geoData = await geocoder.geocode(location);
            console.log("Geocoding response for update:", geoData);
            
            if (!geoData || geoData.length === 0) {
                console.log("Retrying with just location name:", req.body.listing.location);
                geoData = await geocoder.geocode(req.body.listing.location);
                console.log("Second attempt geocoding response:", geoData);
            }
        } catch (geocodeError) {
            console.error("Geocoding error during update:", geocodeError);
            geoData = null;
        }

        // Set coordinates either from geocoding or fallback
        if (geoData && geoData[0]) {
            listing.geometry = {
                type: 'Point',
                coordinates: [geoData[0].longitude, geoData[0].latitude]
            };
            console.log("Updated geometry from geocoding:", listing.geometry);
        } else if (location.toLowerCase().includes('andaman')) {
            listing.geometry = {
                type: 'Point',
                coordinates: [92.8797, 11.7401] // Coordinates for Andaman Islands
            };
            console.log("Using fallback coordinates for Andaman in update");
        } else {
            console.log("No coordinates set for location in update:", location);
        }

        await listing.save();
        req.flash("success", "Listing Updated!");
        res.redirect(`/listings/${id}`);
    } catch (err) {
        console.error("Error updating listing:", err);
        next(err);
    }
};
 module.exports.destroyListing = async(req,res)=>{
       let {id}= req.params;
       let deletedListing=await Listing.findByIdAndDelete(id);
       req.flash("success"," Listing Deleted!");      
       res.redirect("/listings");
     }   
