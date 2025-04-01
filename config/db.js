import mongoose from "mongoose";

export const connectDB=async ()=>{
     await mongoose.connect('mongodb+srv://ZainaAzam:zainaAz2$@cluster0.v26lxo0.mongodb.net/restaurant-web').then(()=>console.log("DB Connected")).catch((err)=>{
        console.log(err)
     });
}