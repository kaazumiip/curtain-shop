const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoURI = "mongodb+srv://kimseyeon6767_db_user:077650853@cluster0.zhl0nxx.mongodb.net/srey_tha";

const productSchema = new mongoose.Schema({
  name: String,
  image: String,
  imageUrl: String // The "wrong" field name
});

const Product = mongoose.model('Product', productSchema);

async function repairImages() {
  try {
    await mongoose.connect(mongoURI);
    console.log("Connected to DB");
    
    // Find all products
    const products = await Product.find({});
    
    for (const p of products) {
      if (!p.image && p.imageUrl) {
        console.log(`Repairing product: ${p.name}`);
        p.image = p.imageUrl;
        await p.save();
      } else if (!p.image) {
        console.log(`Product ${p.name} has no image at all. Setting a placeholder.`);
        // Just as a fallback so it doesn't look broken
        p.image = "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg";
        await p.save();
      }
    }
    
    console.log("Database repair complete.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

repairImages();
