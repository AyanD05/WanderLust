const express = require("express");
const app = express();
const mongoose = require("mongoose");
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync=require("./utils/wrapAsync.js");
const ExpressError=require("./utils/ExpressError.js");
const {listingSchema,reviewSchema}=require("./schema.js");
const Review=require("./models/review.js");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

async function main() {
  await mongoose.connect(MONGO_URL);
}
main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log("Error in connecting DB");
  });
// app.get("/testListing",async (req,res)=>{
//     const sampleListing=new Listing({
//         title:"My New Villa",
//         description:"By the beach",
//         price:1200,
//         location:"Goa",
//         country:"India"
//     });
//     await sampleListing.save();
//     console.log("Saved successfully");
//     res.send("Success");
// });
const validateListing=(req,res,next)=>{
  const {error}=listingSchema.validate(req.body);
  if(error){
    const errMsg=error.details.map((el)=>el.message).join(",");
    throw new ExpressError(400,errMsg);
  }else{
    next();
  }
}
const validateReview=(req,res,next)=>{
  const {error}=reviewSchema.validate(req.body);
  if(error){
    const errMsg=error.details.map((el)=>el.message).join(",");
    throw new ExpressError(400,errMsg);
  }else{
    next();
  }
}

//Index Route
app.get("/listings",wrapAsync( async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
}));
//New Route
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});
//Show Route
app.get("/listings/:id", wrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id).populate("reviews");
  res.render("listings/show.ejs", { listing });
}));
//Create Route
app.post("/listings",validateListing ,wrapAsync( async (req, res) => {
  const listing = req.body.listing;
  
  // const isInvalid = Object.values(listing).some(
  //   (value) => !value || value.trim() === ""
  // );
  
  // if (isInvalid) {
  //   throw new ExpressError(400,"Send valid data for listing");
  // }
  const newListing=new Listing(req.body.listing);
  await newListing.save();
  res.redirect("/listings");
}));
//Edit Route
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
}));
//Update Route
app.put("/listings/:id",validateListing, wrapAsync(async (req, res) => {
  const { id } = req.params;
  if(!req.body.listing){
    throw new ExpressError(400,"Send valid data");
  }
  await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  res.redirect(`/listings/${id}`);
}));
//Delete Route
app.delete("/listings/:id", wrapAsync(async (req, res) => {
  const { id } = req.params;
  const deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  res.redirect("/listings");
}));

//Reviews

//Post route
app.post("/listings/:id/reviews",validateReview,wrapAsync(async(req,res)=>{
  const listing=await Listing.findById(req.params.id);
  const newReview=new Review(req.body.review);
  
  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();
  res.redirect(`/listings/${listing._id}`);
}));
//delete route
app.delete("/listings/:id/reviews/:reviewId",wrapAsync(async(req,res)=>{
  const {id,reviewId}=req.params;
  await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});
  await Review.findByIdAndDelete(reviewId);

  res.redirect(`/listings/${id}`);
}));

// app.all("*",(req,res,next)=>{
//   next(new ExpressError(404,"Page Not Found!"));
// });
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});


app.use((err,req,res,next)=>{
  const {statusCode=500,message="Something went wrong"}=err;
  // res.status(statusCode).send(message);
  res.status(statusCode).render("listings/error.ejs",{message});
});
app.listen(8080, () => {
  console.log("Server connected");
});
