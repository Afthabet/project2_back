const sharp = require('sharp');
const db = require("../models");
const { v4: uuidv4 } = require('uuid');
const Car = db.Car;
const CarImage = db.CarImage;
const path = require('path');
const fs = require('fs');

// Define the absolute path for the uploads directory
const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');

// Ensure the directory exists when the server starts
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created uploads directory at: ${uploadDir}`);
}

exports.create = async (req, res) => {
  console.log("--- [CONTROLLER] cars.create ---");

  const carData = req.body;
  const files = req.files;
  
  console.log("1. Received form data:", carData);
  console.log(`2. Received ${files ? files.length : 0} file(s) for upload.`);

  if (!carData.name || !carData.price) {
    return res.status(400).send({ message: "Name and price cannot be empty!" });
  }

  const transaction = await db.sequelize.transaction();
  console.log("3. Started database transaction.");

  try {
    const newCar = await Car.create({
      id: carData.id,
      make: carData.name.split(' ')[0] || 'Unknown',
      model: carData.name.split(' ').slice(1).join(' ') || 'Model',
      year: parseInt(carData.year),
      price: parseFloat(carData.price),
      mileage: parseInt(carData.mileage),
      bodyStyle: carData.bodyType,
      grade: carData.grade,
      isAvailable: true,
      // The database requires a value for the 'features' column.
      // We are now providing an empty JSON array ('[]') as a default.
      features: carData.features || '[]', 
    }, { transaction });

    console.log("4. ✅ Car record CREATED successfully! ID:", newCar.id);

    if (files && files.length > 0) {
      console.log("5. Processing and saving images...");
      const imagePromises = files.map((file, index) => {
        const filename = `car-${Date.now()}-${uuidv4().slice(0, 6)}.jpeg`;
        const filepath = path.join(uploadDir, filename);

        return sharp(file.buffer)
          .resize({ width: 1280, fit: 'inside', withoutEnlargement: true })
          .toFormat('jpeg', { quality: 85 })
          .toFile(filepath)
          .then(() => {
            return CarImage.create({
              image: `/uploads/${filename}`,
              order: index,
              car_id: newCar.id 
            }, { transaction });
          });
      });
      await Promise.all(imagePromises);
      console.log("6. ✅ Image records CREATED successfully!");
    } else {
      console.log("5. No images were uploaded.");
    }
    
    await transaction.commit();
    console.log("7. 🏆 Database transaction committed successfully.");
    console.log("---------------------------------");
    res.status(201).send(newCar);

  } catch (error) {
    await transaction.rollback();
    console.error("❌ --- FATAL ERROR --- ❌");
    console.error("An error occurred during the create process:", error.original ? error.original.detail : error.message);
    console.error("-----------------------");
    res.status(500).send({ message: `An error occurred while creating the car: ${error.original ? error.original.detail : error.message}` });
  }
};

exports.findAll = (req, res) => {
    Car.findAll({
        include: [{ model: CarImage, as: 'images', order: [['order', 'ASC']] }]
    })
    .then(data => {
        const carsWithStatus = data.map(car => {
            const carJson = car.toJSON();
            // Create a 'name' field for consistency if it doesn't exist
            if (!carJson.name) {
                carJson.name = `${carJson.make || ''} ${carJson.model || ''}`.trim();
            }
            return {
                ...carJson,
                status: carJson.isAvailable ? 'Available' : 'Sold'
            };
        });
        res.send(carsWithStatus);
    })
    .catch(err => {
        console.error("Error retrieving cars:", err);
        res.status(500).send({ message: "Error retrieving cars." });
    });
};

exports.findOne = (req, res) => {
    const id = req.params.id;
    Car.findByPk(id, { include: [{ model: CarImage, as: 'images', order: [['order', 'ASC']] }] })
        .then(data => {
            if (data) {
                res.send(data);
            } else {
                res.status(404).send({ message: `Cannot find Car with id=${id}.` });
            }
        })
        .catch(err => {
            res.status(500).send({ message: "Error retrieving Car with id=" + id });
        });
};

exports.updateStatus = async (req, res) => {
    const id = req.params.id;
    try {
        const car = await Car.findByPk(id);
        if (!car) {
            return res.status(404).send({ message: `Car with id=${id} not found.` });
        }
        await car.update({ isAvailable: !car.isAvailable });
        res.send({ message: "Car status updated successfully." });
    } catch (error) {
        res.status(500).send({ message: "Error updating car status for id=" + id });
    }
};

exports.delete = async (req, res) => {
  const id = req.params.id;
  const transaction = await db.sequelize.transaction();
  try {
    const car = await Car.findByPk(id);
    if (!car) {
      await transaction.rollback();
      return res.status(404).send({ message: `Car with id=${id} not found.` });
    }
    const images = await CarImage.findAll({ where: { car_id: id } });
    for (const img of images) {
      const filepath = path.join(__dirname, '..', '..', 'public', img.image);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }
    await CarImage.destroy({ where: { car_id: id }, transaction });
    await Car.destroy({ where: { id: id }, transaction });
    await transaction.commit();
    res.send({ message: "Car was deleted successfully!" });
  } catch (error) {
    await transaction.rollback();
    res.status(500).send({ message: "Could not delete car with id=" + id });
  }
};
exports.update = async (req, res) => {
  const id = req.params.id;
  const transaction = await db.sequelize.transaction();
  try {
    const car = await Car.findByPk(id, { transaction });
    if (!car) {
      await transaction.rollback();
      return res.status(404).send({ message: "Car not found." });
    }
    
    // 1. Update text fields
    await car.update({
      make: req.body.name.split(' ')[0] || car.make,
      model: req.body.name.split(' ').slice(1).join(' ') || car.model,
      year: parseInt(req.body.year),
      price: parseFloat(req.body.price),
      mileage: parseInt(req.body.mileage),
      bodyStyle: req.body.bodyType,
      grade: req.body.grade,
      features: req.body.features || car.features,
    }, { transaction });

    // 2. Handle Image Updates
    // The frontend sends a JSON string of the images to keep
    const existingImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : [];
    const existingImageIds = existingImages.map(img => img.id);

    // Find and delete images that are NOT in the existingImageIds list
    const imagesToDelete = await CarImage.findAll({ where: { car_id: id, id: { [db.Sequelize.Op.notIn]: existingImageIds } } });
    for (const img of imagesToDelete) {
        // Optional: Delete file from server storage
        const filepath = path.join(__dirname, '..', '..', 'public', img.image);
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
    }
    await CarImage.destroy({ where: { car_id: id, id: { [db.Sequelize.Op.notIn]: existingImageIds } }, transaction });


    // Update the order of the remaining images
    for (let i = 0; i < existingImages.length; i++) {
      await CarImage.update({ order: i }, { where: { id: existingImages[i].id }, transaction });
    }

    // 3. Add any new images that were uploaded
    if (req.files && req.files.length > 0) {
      let currentOrder = existingImages.length;
      for (const file of req.files) {
        const filename = `car-${Date.now()}-${uuidv4().slice(0, 6)}.jpeg`;
        const filepath = path.join(uploadDir, filename);

        await sharp(file.buffer)
          .resize({ width: 1280, fit: 'inside', withoutEnlargement: true })
          .toFormat('jpeg', { quality: 85 })
          .toFile(filepath);
        
        await CarImage.create({
          image: `/uploads/${filename}`,
          order: currentOrder++,
          car_id: id,
        }, { transaction });
      }
    }

    await transaction.commit();
    const updatedCar = await Car.findByPk(id, { include: ["images"] });
    res.send(updatedCar);

  } catch (error) {
    await transaction.rollback();
    console.error("Update error:", error);
    res.status(500).send({ message: "Error updating car: " + error.message });
  }
};