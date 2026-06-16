const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoURI = "mongodb+srv://kimseyeon6767_db_user:077650853@cluster0.zhl0nxx.mongodb.net/srey_tha";

const productSchema = new mongoose.Schema({
  name: String,
  image: String,
});

const Product = mongoose.model('Product', productSchema);

async function checkImages() {
  try {
    await mongoose.connect(mongoURI);
    console.log("Connected to DB");
    const products = await Product.find({});
    console.log("Products found:", products.length);
    products.forEach(p => {
      console.log(`Product: ${p.name}, Image: ${p.image}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkImages();
